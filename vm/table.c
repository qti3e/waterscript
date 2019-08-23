#include "context.h"
#include "wval.h";
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
  ctx->tables.tables = ws_alloc(
      sizeof(struct _table_ctx *) * ctx->tables.capacity);
  assert(ctx->tables.tables != NULL);

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
  int i, h;

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
  int i, h;
  i = 0;

  do
  {
    h = (table->id + i++) % ctx->tables.capacity;
    if (ctx->tables.tables[h] == NULL)
      return NULL;
    if (ctx->tables.tables[h]->id == t->id)
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
  table->buckets = ws_alloc(sizeof(struct _table_slot *) * table->capacity);
  assert(table->buckets != NULL);

  for (i = 0; i < table->capacity; ++i)
    table->buckets[i] = NULL;

  for (i = 0; i < old_cap; ++i)
  {
    current = buckets[i];
    while (current != NULL)
    {
      hash = tbl_hash(current->key) % table->capacity;
      tmp = current->next;
      current->next = table->buckets[hash];
      table->buckets[hash] = current;
      current = tmp;
    }
  }

  ws_free(buckets);
}

struct _table_slot *tbl_get(struct _table_ctx *table, char *key)
{
  struct _table_slot *slot;
  unsigned int hash;

  hash = tbl_hash(key);
  slot = table->buckets[hash];
  for (; slot != NULL; slot = slot->next)
    if (strcmp(slot->key, key) == 0)
      return slot;
  return NULL;
}

void tbl_set(struct _table_ctx *table, char *key, wval *data)
{
  tbl_grow(table);

  struct _table_slot *slot;
  unsigned int hash;

  wval_retain(data);

  slot = tbl_get(table, key);
  if (slot != NULL)
  {
    wval_release(slot->v.value);
    slot->v.value = data;
    return;
  }

  slot = ws_alloc(sizeof(*slot));
  assert(slot != NULL);
  slot->key = strdup(key);
  slot->v.value = data;
  hash = tbl_hash(slot->key);
  slot->next = table->buckets[hash];
  table->buckets[hash] = slot->next;
  ++table->size;
}

void tbl_del(struct _table_ctx *table, ws_val *key)
{
  tbl_grow(table);

  struct _table_slot *slot;
  unsigned int hash;

  slot = tbl_get(table, key);
  if (slot != NULL)
  {
    if (slot->v.is_delete != WTABLE_DEL_MAGIC)
    {
      wval_release(slot->v.value);
      slot->v.is_delete = WTABLE_DEL_MAGIC;
    }
  }
  else
  {
    slot = ws_alloc(sizeof(*slot));
    assert(slot != NULL);
    slot->key = strdup(key);
    slot->v.is_delete = WTABLE_DEL_MAGIC;
    hash = tbl_hash(slot->key);
    slot->next = table->buckets[hash];
    table->buckets[hash] = slot->next;
    ++table->size;
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
  struct _wtable_ctx *table;
  struct _wtable_slot *slot, *tmp;
  unsigned int i;
  int j, h;

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

  for (i = 0; i < table->cpacity; ++i)
  {
    slot = table->buckets[i];
    while (slot != NULL)
    {
      if (slot->v.is_delete != WTABLE_DEL_MAGIC)
        wval_release(slot->v.value);
      tmp = slot->next;
      free(slot->key);
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

  wtable_destroy(c, t);
  child = c->childs;

  for (; child != NULL; child = child->next)
  {
    child2 = child->ctx->childs;
    for (; child2 != NULL; child2 = child2->next)
      wtable_destroy_all_i(child2->ctx, t);
    wtable_destroy(child->ctx, t);
  }
}

void table_destroy_all(ws_table *t)
{
  wtable_destroy_all_i(t->ctx, t);
}

void table_set(ws_context *ctx, ws_table *t, char *key, wval *data)
{
  assert(!ctx->forked);
  struct _wtable_ctx *table;
  table = ctx_tables_find(ctx, t);
  if (table == NULL)
  {
    table = malloc(sizeof(*table));
    assert(table != NULL);
    table->id = t->id;
    table->size = 0;
    table->cpacity = 4;
    table->buckets = malloc(sizeof(struct _wtable_slot *) * 4);
    assert(table->buckets != NULL);
    ctx_tables_insert(ctx, table);
  }
  // Now insert (key, data) to the table.
  tbl_set(table, key, data);
}

void table_del(ws_context *ctx, ws_table *t, char *key)
{
  // DRY.
  assert(!ctx->forked);
  struct _wtable_ctx *table;
  table = ctx_tables_find(ctx, t);
  if (table == NULL)
  {
    table = malloc(sizeof(*table));
    assert(table != NULL);
    table->id = t->id;
    table->size = 0;
    table->cpacity = 4;
    table->buckets = malloc(sizeof(struct _wtable_slot *) * 4);
    assert(table->buckets != NULL);
    ctx_tables_insert(ctx, table);
  }
  tbl_del(table, key);
}

ws_val *table_get(ws_context *ctx, ws_table *t, char *key)
{
  assert(!ctx->forked);
  struct _wtable_ctx *table;
  struct _wtable_slot *slot;
  ws_context *current_ctx;

  current_ctx = ctx;

  for (; current_ctx != NULL; current_ctx = current_ctx->parent)
  {
    table = ctx_tables_find(ctx, t);
    if (table == NULL)
      continue;
    slot = tbl_get(table, key);
    if (slot == NULL)
      continue;
    if (slot->v.is_delete == WTABLE_DEL_MAGIC)
      return NULL;
    return slot->v.value;
  }

  return NULL;
}
