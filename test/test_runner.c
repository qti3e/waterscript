#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <wchar.h>
#include <locale.h>

#include <curses.h>
#include <pthread.h>
#include "test.h"

static int num_tests = 0;
static atomic_int num_pending;

void register_test(char *name, int (*test_fn)(char **buf))
{
	static int id = -1;
	++id;
	if (id >= NUM_TESTS) {
		printf("Max number of tests exceed.\n");
		exit(-1);
	}
	ws_tests[id].name = name;
        ws_tests[id].test_fn = test_fn;
        ws_tests[id].status = LOADING;
        ws_tests[id].buf = NULL;
        num_tests++;
}

void *run_test(void *x)
{
        int id = *((int *)x);
        int ret = ws_tests[id].test_fn(&ws_tests[id].buf);
        num_pending--;
        ws_tests[id].status = ret;
        return (void *)0;
}

void render_results()
{
        static int frame = 0;
        static char *loading[] = {".", "o", "O", "@", "*"};
        static char *indicators[] = {"PASSED", "FAILED"};

        char *name;
        char *abuf;
        int status;

	clear();
        refresh();
        ++frame;

        for (int i = 0; i < num_tests; ++i) {
                name = ws_tests[i].name;
                status = ws_tests[i].status;
                abuf = ws_tests[i].buf;

                if (status == 0) {
                        attron(COLOR_PAIR(10));
                        printw(" %s", indicators[0]);
                        attroff(COLOR_PAIR(10));
                } else if (status == LOADING) {
                        printw("   %s   ", loading[(i + frame) % 5]);
                } else {
                        attron(COLOR_PAIR(11));
                        printw(" %s", indicators[1]);
                        attroff(COLOR_PAIR(11));
                }

                printw(" %s\n", name);
                if (abuf != NULL) {
                        printw("\t Assertation failed: %s\n", abuf);
                }
        }

        refresh();
}

int run_tests()
{
	pthread_t thread_id[NUM_TESTS];
	int args[NUM_TESTS];

        if (num_tests == 0) {
                printw("Error: No test to be executed.\n");
                return 1;
        }

	for (int i = 0; i < num_tests; ++i) {
                num_pending++;
		args[i] = i;
                pthread_create(&thread_id[i], NULL, &run_test, &args[i]);
	}

	while (1) {
                render_results();
		usleep(500 * 1000);
                printf("%d\n", num_pending);
                if (num_pending == 0)
                        break;
	}
        render_results();

	for (int i = 0; i < num_tests; ++i)
		pthread_join(thread_id[i], NULL);

	for (int i = 0; i < num_tests; ++i)
                if (ws_tests[i].status != 0) return -1;
        return 0;
}

void tests() {
        REG_TEST(constant_pool);
}

int main()
{
        setlocale(LC_CTYPE, "");
	initscr();
	cbreak();   // among other things, disable buffering
    	noecho();   // disable "echo" of characters from input

	start_color();
	init_pair(10, COLOR_GREEN, COLOR_BLACK);
	init_pair(11, COLOR_RED, COLOR_BLACK);

        tests();
	int status = run_tests();

        getch();
	endwin();

        return status;
}
