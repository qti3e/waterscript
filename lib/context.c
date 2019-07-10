#include <stdatomic.h>
#include <setjmp.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "wval.h"
#include "context.h"

context *context_create()
{
        static atomic_uint last_context_id = 0;

        context *ctx = malloc(sizeof(*ctx));
        assert(ctx != NULL);
        ctx->id = last_context_id++;
        ctx->parent = NULL;
        ctx->childs = NULL;
        ctx->forked = 0;
        ctx->_ref_count = 0;
        ctx->ds_head = NULL;
        ctx->scope = NULL;
        ctx->functions.cursor = 0;
        ctx->functions.capacity = 0;
        ctx->functions.from = 0;
        ctx->functions.array = NULL;
        ctx->tables.size = 0;
        ctx->tables.capacity = 0;
        ctx->tables.tables = NULL;
        ctx->on_throw = NULL;
        return ctx;
}

void context_compile(context *ctx, char *code)
{
        // TODO(qti3e)
}

void context_destroy(context *ctx)
{
        assert(ctx->_ref_count <= 0);
        assert(ctx->childs == NULL);

        unsigned int i, j;
        context *parent;
        struct _wtable_slot *slot, *tmp;
        struct _wtable_ctx *wt_ctx;

        scope_release(ctx->scope);
        ds_entity_release(ctx->ds_head);

        for (i = 0; i < ctx->functions.cursor; ++i)
                wval_release(ctx->functions.array[i]);
        free(ctx->functions.array);

        for (i = 0; i < ctx->tables.capacity; ++i) {
                wt_ctx = ctx->tables.tables[i];
                for (j = 0; j < wt_ctx->cpacity; ++j) {
                        slot = wt_ctx->buckets[j];
                        while (slot != NULL) {
                                if (slot->v.is_delete != WTABLE_DEL_MAGIC)
                                        wval_release(slot->v.value);
                                tmp = slot->next;
                                free(slot->key);
                                free(slot);
                                slot = tmp;
                        }
                }
                free(wt_ctx->buckets);
                free(wt_ctx);
        }
        free(ctx->tables.tables);

        parent = ctx->parent;
        if (parent != NULL)
                context_list_del(&(parent->childs), ctx);

        context_release(parent);

        free(ctx);
}

void context_retain(context *ctx)
{
        if (ctx == NULL) return;
        ++ctx->_ref_count;
}

void context_release(context *ctx)
{
        if (ctx == NULL) return;
        assert(ctx->_ref_count > 0);
        --ctx->_ref_count;
        if (ctx->_ref_count == 0)
                context_destroy(ctx);
}

void context_request_run(context *ctx)
{
        // TODO(qti3e)
}

int context_is_deep_parent(context *ctx, context *test)
{
        context *current = ctx->parent;
        for (; current != NULL; current = current->parent) {
                if (current == test)
                        return 1;
        }
        return 0;
}

void context_fork(context *ctx, unsigned int n)
{
        assert(n > 1);
        assert(!ctx->forked);

        context_list *tail;
        context_list *tmp;

        ctx->forked = 1;
        tail = NULL;

        for (; n > 0; --n) {
                tmp = malloc(sizeof(*tmp));
                assert(tmp != NULL);
                tmp->ctx = context_create();
                tmp->ctx->parent = ctx;
                tmp->ctx->ds_head = ctx->ds_head;
                tmp->ctx->scope = ctx->scope;
                tmp->ctx->functions.from = ctx->functions.cursor +
                        ctx->functions.from;

                context_retain(ctx); // But not tmp->ctx, childs list does not
                                     // affect ref_count.
                ds_entity_retain(tmp->ctx->ds_head);
                scope_retain(tmp->ctx->scope);
                // Insert tmp to the list.
                if (tail == NULL) {
                        ctx->childs = tmp;
                        tail = tmp;
                } else {
                        tail->next = tmp;
                        tail = tmp;
                }
        }
        tail->next = NULL;
}

void context_list_request_run(context_list *list)
{
        context_list *current;
        current = list;
        for (; current != NULL; current = current->next) {
                context_request_run(current->ctx);
        }
}

void context_list_free(context_list *list)
{
        context_list *tmp;
        while (list != NULL) {
                tmp = list->next;
                free(list);
                list = tmp;
        }
}

// TODO(qti3e) Refactor.
void context_list_del(context_list **list, context *ctx)
{
        if (*list == NULL) return;

        context_list *tmp, *cursor;

        if ((*list)->ctx == ctx) {
                tmp = *list;
                *list = (*list)->next;
                free(tmp);
                return;
        }

        cursor = *list;
        while (cursor->next != NULL) {
                if (cursor->next->ctx == ctx) {
                        tmp = cursor->next;
                        cursor->next = tmp->next;
                        free(tmp);
                        return;
                }
        }
}

void context_new_scope(context *ctx, int is_function_body)
{
        assert(!ctx->forked);
        scope *s = malloc(sizeof(*s));
        assert(s != NULL);
        s->prev = ctx->scope;
        s->is_function_body = is_function_body;
        s->_ref_count = 1;
        s->table = malloc(sizeof(wtable));
        assert(s->table != NULL);
        wtable_init(ctx, s->table);
        // These two lines are canceled out together.
        // scope_release(ctx->scope);
        // scope_retain(s->prev);
        ctx->scope = s;
}

void context_pop_scope(context *ctx)
{
        assert(!ctx->forked);
        assert(ctx->scope != NULL);
        scope *tmp = ctx->scope;
        ctx->scope = tmp->prev;
        scope_retain(tmp->prev);
        scope_release(tmp);
}

void context_define(context *ctx, char *var, wval *val, int in_function_body)
{
        assert(!ctx->forked);
        scope *s = ctx->scope;
        if (in_function_body)
                while (s != NULL && s->is_function_body == 0)
                        s = s->prev;
        assert(s != NULL);
        wtable_set(ctx, s->table, var, val); // Note: it calls wval_retain(val)
}

wval *context_resolve(context *ctx, char *var)
{
        wval *ret;
        scope *s = ctx->scope;
        for (; s != NULL; s = s->prev) {
                ret = wtable_get(ctx, s->table, var);
                if (ret != NULL)
                        return ret;
        }
        return NULL;
}

unsigned int context_add_function(context *ctx, wval *fn)
{
        assert(!ctx->forked);
        assert(fn->type == WS_FUNCTION);

        unsigned int cursor, id, new_capacity;
        wval **array; // In case of grow

        cursor = ctx->functions.cursor++;
        id = cursor + ctx->functions.from;

        if (cursor >= ctx->functions.capacity) {
                // Grow
                new_capacity = ctx->functions.capacity * 2;
                if (new_capacity == 0)
                        new_capacity = 10;
                array = realloc(ctx->functions.array,
                                new_capacity * sizeof(wval*));
                assert(array != NULL);
                ctx->functions.array = array;
        }

        wval_retain(fn);
        ctx->functions.array[cursor] = fn;

        return id;
}

wval *contex_fetch_function(context *ctx, unsigned int id)
{
        context *c;
        unsigned int cursor;

        for (
        c = ctx;
        c != NULL && id < c->functions.from && c->functions.capacity > 0;
        c = c->parent) {}

        assert(c != NULL);

        cursor = id - c->functions.from;
        assert(cursor < c->functions.capacity);

        return c->functions.array[cursor];
}

void scope_retain(scope *s)
{
        if (s == NULL) return;
        ++s->_ref_count;
}

void scope_release(scope *s)
{
        if (s == NULL) return;
        --s->_ref_count;
        if (s->_ref_count > 0) return;
        scope_release(s->prev);
        wtable_destroy_all(s->table);
        free(s);
}

void ds_entity_retain(ds_entity *e)
{
        if (e == NULL) return;
        ++e->_ref_count;
}

void ds_entity_release(ds_entity *e)
{
        if (e == NULL) return;
        --e->_ref_count;
        if (e->_ref_count > 0) return;
        wval_release(e->value);
        free(e);
}

void context_ds_push(context *ctx, wval *val)
{
        assert(!ctx->forked);
        ds_entity *e;

        wval_retain(val);

        e = malloc(sizeof(*e));
        assert(e != NULL);
        e->value = val;
        e->_ref_count = 1;
        e->next = ctx->ds_head;
        ctx->ds_head = e;
}

wval *context_ds_peek(context *ctx)
{
        if (ctx->ds_head == NULL)
                return NULL;
        return ctx->ds_head->value;
}

wval *context_ds_pop(context *ctx)
{
        assert(!ctx->forked);
        assert(ctx->ds_head != NULL);
        wval *ret = ctx->ds_head->value;
        // Increment the _ref_count, so when we release the ds entity
        // it does not free the value.
        ++ret->_ref_count;

        ds_entity *tmp = ctx->ds_head->next;
        ds_entity_release(ctx->ds_head);
        ctx->ds_head = tmp;

        // Set _ref_count back to what it was.
        --ret->_ref_count;
        return ret;
}

//==============================================================================
// Some private functions to work with ctx.tables
void ctx_tables_insert(context *ctx, struct _wtable_ctx *w);

void ctx_tables_grow(context *ctx)
{
        struct _wtable_ctx **tables;
        unsigned int i, old_cap;

        old_cap = ctx->tables.capacity;
        ctx->tables.capacity *= 2;
        if (ctx->tables.capacity == 0)
                ctx->tables.capacity = 4;

        tables = ctx->tables.tables;
        ctx->tables.tables = malloc(
                        sizeof(struct _wtable_ctx*) * ctx->tables.capacity);
        assert(ctx->tables.tables != NULL);

        for (i = 0; i < ctx->tables.capacity; ++i)
                ctx->tables.tables[i] = NULL;

        ctx->tables.size = 0;
        for (i = 0; i < old_cap; ++i)
                if (tables[i] != NULL)
                        ctx_tables_insert(ctx, tables[i]);

        free(tables);
}

void ctx_tables_insert(context *ctx, struct _wtable_ctx *w)
{
        int i, h;

        ++ctx->tables.size;
        if (ctx->tables.size > ctx->tables.capacity)
                ctx_tables_grow(ctx);

        i = 0;
        do {
                h = (w->id + i++) % ctx->tables.capacity;
                if (ctx->tables.tables[h] == NULL) {
                        ctx->tables.tables[h] = w;
                        break;
                }
        } while (i != ctx->tables.capacity);
}

struct _wtable_ctx *ctx_tables_find(context *ctx, wtable *t)
{
        int i, h;
        i = 0;

        do {
                h = (t->id + i++) % ctx->tables.capacity;
                if (ctx->tables.tables[h] == NULL)
                        return NULL;
                if (ctx->tables.tables[h]->id == t->id)
                        return ctx->tables.tables[h];
        } while (i != ctx->tables.capacity);

        return NULL;
}

//==============================================================================
// Private function to work with _wtable_ctx
// This is the hash from JVM.
unsigned long tbl_hash(char *str)
{
    unsigned long hash = 0;
    int c;

    while ((c = *str++))
        hash = ((hash << 5) - hash) + c; // hash * 31 + c

    return hash;
}

void tbl_grow(struct _wtable_ctx *table)
{
        struct _wtable_slot **buckets;
        struct _wtable_slot *current, *tmp;
        unsigned int i, old_cap;
        unsigned long hash;

        if (2 * table->cpacity >= table->size)
                return;

        old_cap = table->cpacity;
        table->cpacity *= 2;
        if (table->cpacity == 0)
                table->cpacity = 4;

        buckets = table->buckets;
        table->buckets = malloc(sizeof(struct _wtable_slot*) * table->cpacity);
        assert(table->buckets != NULL);

        for (i = 0; i < table->cpacity; ++i)
                table->buckets[i] = NULL;

        for (i = 0; i < old_cap; ++i) {
                current = buckets[i];
                while (current != NULL) {
                        hash = tbl_hash(current->key) % table->cpacity;
                        tmp = current->next;
                        current->next = table->buckets[hash];
                        table->buckets[hash] = current;
                        current = tmp;
                }
        }

        free(buckets);
}

struct _wtable_slot *tbl_get(struct _wtable_ctx *table, char *key)
{
        struct _wtable_slot *slot;
        unsigned int hash;

        hash = tbl_hash(key);
        slot = table->buckets[hash];
        for (; slot != NULL; slot = slot->next)
                if (strcmp(slot->key, key) == 0)
                        return slot;
        return NULL;
}

void tbl_set(struct _wtable_ctx *table, char *key, wval *data)
{
        tbl_grow(table);

        struct _wtable_slot *slot;
        unsigned int hash;

        wval_retain(data);

        slot = tbl_get(table, key);
        if (slot != NULL) {
                wval_release(slot->v.value);
                slot->v.value = data;
                return;
        }

        slot = malloc(sizeof(*slot));
        assert(slot != NULL);
        slot->key = strdup(key);
        slot->v.value = data;
        hash = tbl_hash(slot->key);
        slot->next = table->buckets[hash];
        table->buckets[hash] = slot->next;
        ++table->size;
}

void tbl_del(struct _wtable_ctx *table, char *key)
{
        tbl_grow(table);

        struct _wtable_slot *slot;
        unsigned int hash;

        slot = tbl_get(table, key);
        if (slot != NULL) {
                if (slot->v.is_delete != WTABLE_DEL_MAGIC) {
                        wval_release(slot->v.value);
                        slot->v.is_delete = WTABLE_DEL_MAGIC;
                }
        } else {
                slot = malloc(sizeof(*slot));
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

void wtable_init(context *ctx, void *m)
{
        assert(!ctx->forked);
        static atomic_uint last_table_id = 0;
        ((wtable *)m)->id = last_table_id++;
        ((wtable *)m)->ctx = ctx;
}

void wtable_destroy(context *ctx, wtable *t)
{
        struct _wtable_ctx *table;
        struct _wtable_slot *slot, *tmp;
        unsigned int i;
        int j, h;

        table = NULL;

        j = 0;
        do {
                h = (t->id + j++) % ctx->tables.capacity;
                if (ctx->tables.tables[h] == NULL) return;
                if (ctx->tables.tables[h]->id == t->id) {
                        table = ctx->tables.tables[h];
                        ctx->tables.tables[h] = NULL;
                        break;
                }
        } while (j != ctx->tables.capacity);

        if (table == NULL) return;

        for (i = 0; i < table->cpacity; ++i) {
                slot = table->buckets[i];
                while (slot != NULL) {
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

void wtable_destroy_all_i(context *c, wtable *t)
{
        context_list *child, *child2;

        wtable_destroy(c, t);
        child = c->childs;

        for (; child != NULL; child = child->next) {
                child2 = child->ctx->childs;
                for (; child2 != NULL; child2 = child2->next)
                        wtable_destroy_all_i(child2->ctx, t);
                wtable_destroy(child->ctx, t);
        }
}

void wtable_destroy_all(wtable *t)
{
        wtable_destroy_all_i(t->ctx, t);
}

void wtable_set(context *ctx, wtable *t, char *key, wval *data)
{
        assert(!ctx->forked);
        struct _wtable_ctx *table;
        table = ctx_tables_find(ctx, t);
        if (table == NULL) {
                table = malloc(sizeof(*table));
                assert(table != NULL);
                table->id = t->id;
                table->size = 0;
                table->cpacity = 4;
                table->buckets = malloc(sizeof(struct _wtable_slot*) * 4);
                assert(table->buckets != NULL);
                ctx_tables_insert(ctx, table);
        }
        // Now insert (key, data) to the table.
        tbl_set(table, key, data);
}

void wtable_del(context *ctx, wtable *t, char *key)
{
        // DRY.
        assert(!ctx->forked);
        struct _wtable_ctx *table;
        table = ctx_tables_find(ctx, t);
        if (table == NULL) {
                table = malloc(sizeof(*table));
                assert(table != NULL);
                table->id = t->id;
                table->size = 0;
                table->cpacity = 4;
                table->buckets = malloc(sizeof(struct _wtable_slot*) * 4);
                assert(table->buckets != NULL);
                ctx_tables_insert(ctx, table);
        }
        tbl_del(table, key);
}

wval *wtable_get(context *ctx, wtable *t, char *key)
{
        assert(!ctx->forked);
        struct _wtable_ctx *table;
        struct _wtable_slot *slot;
        context *current_ctx;

        current_ctx = ctx;

        for (; current_ctx != NULL; current_ctx = current_ctx->parent) {
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
