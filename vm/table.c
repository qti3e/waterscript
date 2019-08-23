#include "context.h"
#include "wval.h"
#include "common.h"
#include "alloc.h"

//==============================================================================
// Some private functions to work with ctx.tables
void ctx_tables_insert(ws_context *ctx, struct _table_ctx *w);

void ctx_tables_grow(ws_context *ctx)
{
  struct _table_ctx **tables;
  unsigned int i, old_cap;

  old_cap = ctx->tables.capacity;
  ctx->tables.capacity *= 2;
  if (ctx->tables.capacity == 0)
    ctx->tables.capacity = 4;

  tables = ctx->tables.tables;
  ctx->tables.tables = (struct _table_ctx **)ws_alloc(
      sizeof(struct _table_ctx *) * ctx->tables.capacity);

  for (i = 0; i < ctx->tables.capacity; ++i)
    ctx->tables.tables[i] = NULL;

  ctx->tables.size = 0;
  for (i = 0; i < old_cap; ++i)
    if (tables[i] != NULL)
      ctx_tables_insert(ctx, tables[i]);

  ws_free(tables);
}

void ctx_tables_insert(ws_context *ctx, struct _table_ctx *w)
{
  unsigned int i, h;

  ++ctx->tables.size;
  if (ctx->tables.size > ctx->tables.capacity)
    ctx_tables_grow(ctx);

  i = 0;
  do
  {
    h = (w->id + i++) % ctx->tables.capacity;
    if (ctx->tables.tables[h] == NULL)
    {
      ctx->tables.tables[h] = w;
      break;
    }
  } while (i != ctx->tables.capacity);
}

struct _table_ctx *ctx_tables_find(ws_context *ctx, ws_table *table)
{
  unsigned int i, h;
  i = 0;

  if (ctx->tables.capacity == 0)
    return NULL;

  do
  {
    h = (table->id + i++) % ctx->tables.capacity;
    if (ctx->tables.tables[h] == NULL)
      return NULL;
    if (ctx->tables.tables[h]->id == table->id)
      return ctx->tables.tables[h];
  } while (i != ctx->tables.capacity);

  return NULL;
}

//==============================================================================
// Private function to work with _table_ctx

void tbl_grow(struct _table_ctx *table)
{
  struct _table_slot **buckets;
  struct _table_slot *current, *tmp;
  unsigned int i, old_cap;
  unsigned long hash;

  if (2 * table->capacity >= table->size)
    return;

  old_cap = table->capacity;
  table->capacity *= 2;
  if (table->capacity == 0)
    table->capacity = 4;

  buckets = table->buckets;
  table->buckets = (struct _table_slot **)ws_alloc(sizeof(struct _table_slot *) * table->capacity);

  for (i = 0; i < table->capacity; ++i)
    table->buckets[i] = NULL;

  for (i = 0; i < old_cap; ++i)
  {
    current = buckets[i];
    while (current != NULL)
    {
      hash = ws_hash(current->key) % table->capacity;
      tmp = current->next;
      current->next = table->buckets[hash];
      table->buckets[hash] = current;
      current = tmp;
    }
  }

  ws_free(buckets);
}

struct _table_slot *tbl_get(struct _table_ctx *table, ws_val *key)
{
  struct _table_slot *slot;
  unsigned int hash;

  hash = ws_hash(key) % table->capacity;
  slot = table->buckets[hash];
  for (; slot != NULL; slot = slot->next)
  {
    if (slot->key == key || wval_strict_equal(slot->key, key))
      return slot;
  }
  return NULL;
}

void tbl_set(struct _table_ctx *table, ws_val *key, void *data)
{
  tbl_grow(table);

  struct _table_slot *slot;
  unsigned int hash;

  slot = tbl_get(table, key);

  if (slot != NULL)
  {
    slot->is_delete = 0;
    slot->value = data;
    return;
  }

  slot = (struct _table_slot *)ws_alloc(sizeof(*slot));
  slot->key = key;
  slot->value = data;
  slot->is_delete = 0;
  hash = ws_hash(slot->key) % table->capacity;
  slot->next = table->buckets[hash];
  table->buckets[hash] = slot;
  ++table->size;
  wval_retain(key);
}

void tbl_del(struct _table_ctx *table, ws_val *key)
{
  struct _table_slot *slot;
  unsigned int hash;

  slot = tbl_get(table, key);

  if (slot != NULL)
  {
    if (!slot->is_delete)
    {
      slot->value = NULL;
      slot->is_delete = 1;
    }
  }
  else
  {
    tbl_grow(table);
    slot = (struct _table_slot *)ws_alloc(sizeof(*slot));
    slot->key = key;
    slot->is_delete = 1;
    slot->value = NULL;
    hash = ws_hash(slot->key) % table->capacity;
    slot->next = table->buckets[hash];
    table->buckets[hash] = slot;
    ++table->size;
    wval_retain(key);
  }
}

//==============================================================================

void table_init(ws_context *ctx, void *mem)
{
  static atomic_uint last_table_id = 0;

  if (ctx->forked)
    die("ws_context: Cannote create a new table on a forked ws_context.");

  ((ws_table *)mem)->id = last_table_id++;
  ((ws_table *)mem)->ctx = ctx;
}

void table_destroy(ws_context *ctx, ws_table *t)
{
  struct _table_ctx *table;
  struct _table_slot *slot, *tmp;
  unsigned int i, j, h;

  table = NULL;

  j = 0;
  do
  {
    h = (t->id + j++) % ctx->tables.capacity;
    if (ctx->tables.tables[h] == NULL)
      return;
    if (ctx->tables.tables[h]->id == t->id)
    {
      table = ctx->tables.tables[h];
      ctx->tables.tables[h] = NULL;
      break;
    }
  } while (j != ctx->tables.capacity);

  if (table == NULL)
    return;

  for (i = 0; i < table->capacity; ++i)
  {
    slot = table->buckets[i];
    while (slot != NULL)
    {
      tmp = slot->next;
      wval_release(slot->key);
      free(slot);
      slot = tmp;
    }
  }

  free(table->buckets);
  free(table);
}

void table_destroy_all_i(ws_context *c, ws_table *t)
{
  ws_context_list *child, *child2;

  table_destroy(c, t);
  child = c->childs;

  for (; child != NULL; child = child->next)
  {
    child2 = child->ctx->childs;
    for (; child2 != NULL; child2 = child2->next)
      table_destroy_all_i(child2->ctx, t);
    table_destroy(child->ctx, t);
  }
}

void table_destroy_all(ws_table *t)
{
  table_destroy_all_i(t->ctx, t);
}

void table_set(ws_context *ctx, ws_table *t, ws_val *key, void *data)
{
  if (ctx->forked)
    die("context: Cannot set a value on a table after context is being forked.");
  struct _table_ctx *table;
  table = ctx_tables_find(ctx, t);
  if (table == NULL)
  {
    table = (struct _table_ctx *)ws_alloc(sizeof(*table));
    table->id = t->id;
    table->size = 0;
    table->capacity = 4;
    table->buckets = (struct _table_slot **)ws_alloc(sizeof(struct _table_slot *) * 4);
    ctx_tables_insert(ctx, table);
  }
  // Now insert (key, data) to the table.
  tbl_set(table, key, data);
}

void table_del(ws_context *ctx, ws_table *t, ws_val *key)
{
  if (ctx->forked)
    die("context: Cannot delete a value on a table after context is being forked.");

  // DRY.
  struct _table_ctx *table;
  table = ctx_tables_find(ctx, t);
  if (table == NULL)
  {
    table = (struct _table_ctx *)ws_alloc(sizeof(*table));
    table->id = t->id;
    table->size = 0;
    table->capacity = 4;
    table->buckets = (struct _table_slot **)ws_alloc(sizeof(struct _table_slot *) * 4);
    ctx_tables_insert(ctx, table);
  }
  tbl_del(table, key);
}

void *table_get(ws_context *ctx, ws_table *t, ws_val *key)
{
  struct _table_ctx *table;
  struct _table_slot *slot;
  ws_context *current_ctx;

  current_ctx = ctx;

  for (; current_ctx != NULL; current_ctx = current_ctx->parent)
  {
    table = ctx_tables_find(current_ctx, t);
    if (table == NULL)
      continue;
    slot = tbl_get(table, key);
    if (slot == NULL)
      continue;
    if (slot->is_delete)
      return NULL;
    return slot->value;
  }

  return NULL;
}
