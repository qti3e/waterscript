cmake_minimum_required(VERSION 3.5)

project (waterscript)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

option(BUILD_TESTS "Enable test target" OFF)
set(CMAKE_C_FLAGS "-Wall -Wextra -O3")

file(GLOB_RECURSE CLI_C_FILES "cli/*.c")
file(GLOB_RECURSE LIB_C_FILES "lib/*.c")
file(GLOB_RECURSE TEST_C_FILES "test/*.c")

# Create the executable
ADD_EXECUTABLE(ws ${CLI_C_FILES} ${LIB_C_FILES})
TARGET_INCLUDE_DIRECTORIES(ws PRIVATE headers)

# Tests
if(WITH_TESTS)
  add_definitions(-DTEST)
  set(CURSES_NEED_NCURSES true)
  find_package(Threads)
  find_package(Curses)

  add_executable(tests EXCLUDE_FROM_ALL ${TEST_C_FILES} ${LIB_C_FILES})
  target_include_directories(tests PRIVATE headers)
  target_link_libraries(tests ${CMAKE_THREAD_LIBS_INIT})
  target_link_libraries(tests ${CURSES_LIBRARIES})
endif()
