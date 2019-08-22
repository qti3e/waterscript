cmake_minimum_required(VERSION 3.5)

project (waterscript)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

option(BUILD_TESTS "Enable test target" OFF)
set(CMAKE_C_FLAGS "-Wall -Wextra -O3")

file(GLOB_RECURSE CLI_C_FILES "vm/*.c")
# file(GLOB_RECURSE LIB_C_FILES "lib/*.c")

# Create the executable
ADD_EXECUTABLE(ws ${CLI_C_FILES} ${LIB_C_FILES})
TARGET_INCLUDE_DIRECTORIES(ws PRIVATE headers)
