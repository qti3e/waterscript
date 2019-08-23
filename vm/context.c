#include "context.h"
#include "wval.h";
#include "common.h"
#include "alloc.h"

// For documentation and comments see context.h :)

ws_context *context_create()
{
  static atomic_uint last_context_id = 0;

  ws_context *ctx = ws_alloc(sizeof(*ctx));
  ctx->id = ++last_context_id;
  ctx->ref_count = 1;

  ctx->forked = 0;
  ctx->parent = NULL;
  ctx->childs = NULL;

  ctx->ds_head = NULL;
  ctx->scope = NULL;

  ctx->tables.capacity = 0;
  ctx->tables.size = 0;
  ctx->tables.tables = NULL;
  return ctx;
}

void context_destroy(ws_context *ctx)
{
  if (ctx->ref_count > 0 || ctx->childs != NULL)
    die("context_destroy: Cannot destroy a in use context.");

  // TODO(qti3e)
  die("Not implemented.");
}

void context_retain(ws_context *ctx)
{
  if (ctx == NULL)
    return;
  ++ctx->ref_count;
}

void context_release(ws_context *ctx)
{
  if (ctx == NULL)
    return;
  if (ctx->ref_count <= 0)
    die("context_release: Cannot release a context which is already not used.");
  --ctx->ref_count;
  // TODO(qti3e) Background GC.
  if (ctx->ref_count == 0)
    context_destroy(ctx);
}

int context_is_parent_of(ws_context *base, ws_context *ctx)
{
  ws_context *current = ctx->parent;
  for (; current != NULL; current = current->parent)
  {
    if (current == base)
      return 1;
  }
  return 0;
}

void context_fork(ws_context *ctx, unsigned int n)
{
  if (n <= 1)
    die("context_fork: Number of branches must be greater than 1.");
  if (ctx->forked)
    die("context_fork: Cannot fork a context which is already forked.");

  ws_context_list *tail;
  ws_context_list *tmp;

  ctx->forked = 1;
  tail = NULL;

  for (unsigned int i = 0; i < n; ++i)
  {
    tmp = ws_alloc(sizeof(*tmp));
    tmp->ctx = context_create();
    tmp->ctx->parent = ctx;
    tmp->ctx->ds_head = ctx->ds_head;
    tmp->ctx->scope = ctx->scope;

    if (tail == NULL)
    {
      ctx->childs = tmp;
      tail = tmp;
    }
    else
    {
      tail->next = tmp;
      tail = tmp;
    }
  }

  // Retains.
  ctx->ref_count += n;
  if (ctx->ds_head != NULL)
    ctx->ds_head->ref_count += n;
  if (ctx->scope != NULL)
    ctx->scope->ref_count += n;

  tail->next = NULL;
}

void context_list_free(ws_context_list *list)
{
  ws_context_list *tmp;
  while (list != NULL)
  {
    tmp = list->next;
    ws_free(list);
    list = tmp;
  }
}

void context_list_del(ws_context_list **list, ws_context *ctx)
{
  if (*list == NULL)
    return;

  ws_context_list *tmp, *cursor;

  if ((*list)->ctx == ctx)
  {
    tmp = *list;
    *list = (*list)->next;
    ws_free(tmp);
    return;
  }

  cursor = *list;
  while (cursor->next != NULL)
  {
    if (cursor->next->ctx == ctx)
    {
      tmp = cursor->next;
      cursor->next = tmp->next;
      ws_free(tmp);
      return;
    }
  }
}

void context_new_scope(ws_context *ctx, int is_block)
{
  if (ctx->forked)
    die("context: Cannot create a new scope on a forked context.");
  ws_scope *s = ws_alloc(sizeof(*s));
  s->parent = ctx->scope;
  s->is_block = is_block;
  s->ref_count = 1;
  table_init(ctx, &s->table);
  // These two lines are canceled out together.
  // scope_release(ctx->scope);
  // scope_retain(s->prev);
  ctx->scope = s;
}

void context_pop_scope(ws_context *ctx)
{
  if (ctx->forked)
    die("context: Cannot pop a scope from a forked context.");
  if (ctx->scope == NULL)
    die("context: Run out of stack.");
  ws_scope *tmp = ctx->scope;
  ctx->scope = tmp->parent;
  // ! In scope_release when we want to destroy the scope
  // ! We must remember to release the parent.
  scope_retain(ctx->scope);
  scope_release(tmp);
}

void context_define(ws_context *ctx, ws_val *key, ws_val *value, int stick_to_block)
{
  if (ctx->forked)
    die("context: Cannot define a new variable on a forked context.");
  ws_scope *scope = ctx->scope;
  if (!stick_to_block)
    while (scope != NULL && scope->is_block)
      scope = scope->parent;
  if (scope == NULL)
    die("context: Cannot declare variable, scope is not available.");
  table_set(ctx, &scope->table, key, value);
}

ws_val *context_resolve(ws_context *ctx, ws_val *key)
{
  ws_val *ret;
  ws_scope *scope = ctx->scope;
  for (; scope != NULL; scope = scope->parent)
  {
    ret = table_get(ctx, &scope->table, key);
    if (ret != NULL)
      return ret;
  }
  return NULL;
}

void scope_retain(ws_scope *scope)
{
  if (scope == NULL)
    return;
  ++scope->ref_count;
}

void scope_release(ws_scope *scope)
{
  if (scope == NULL)
    return;
  --scope->ref_count;
  if (scope->ref_count == 0)
  {
    // TODO(qti3e) GC.
  }
}

void ds_entity_retain(ws_ds_entity *entity)
{
  if (entity == NULL)
    return;
  ++entity->ref_count;
}

void ds_entity_release(ws_ds_entity *entity)
{
  if (entity == NULL)
    return;
  --entity->ref_count;
  if (entity->ref_count == 0)
  {
    // TODO(qti3e) GC.
  }
}

void context_ds_push(ws_context *ctx, ws_val *value)
{
  if (ctx->forked)
    die("context: Cannot push a new value to the data stack on forked context.");

  ws_ds_entity *e;
  e = ws_alloc(sizeof(*e));
  e->value = value;
  e->ref_count = 1;
  e->next = ctx->ds_head;
  ctx->ds_head = e;

  wval_retain(value);
}

ws_val *context_ds_peek(ws_context *ctx)
{
  if (ctx->ds_head == NULL)
    return NULL;

  ws_val *value = ctx->ds_head->value;
  wval_retain(value);
  return value;
}

ws_val *context_ds_pop(ws_context *ctx)
{
  if (ctx->forked)
    die("context: Cannot pop a value from the data stack on forked context.");
  if (ctx->ds_head == NULL)
    die("context: Run out of data stack.");

  ws_val *value = ctx->ds_head->value;
  wval_retain(value);

  ws_ds_entity *tmp = ctx->ds_head->next;
  ds_entity_release(ctx->ds_head);
  ctx->ds_head = tmp;

  return value;
}