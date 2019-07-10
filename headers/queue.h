#ifndef __WS_QUEUE__
#define __WS_QUEUE__

/**
 * Very simple queue implementation, centralized in one place
 * so we can make it lock-free in future without touching the
 * interface.
 */
struct queue {
        void *head;
        void *tail;
        pthread_mutex_t _lock;
};

void enqueue(struct queue *q, void *data);
void *dequeue(struct queue *q);

#endif
