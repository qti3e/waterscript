# WS JSC

WaterScript JavaScript compiler is ECMAScript compiler which targets WSVM
(WaterScript Virtual Machine) the compiler it self is written in Typescript and
it must be able to compile it self so that it can be embedded in the VM it self
as the standard compiler.

# Overview

This diagram shows how the compiler actually compiles it self to WSVMBC.

```
                                                   +-----------+
                                                   |           |
                       +--------------+   +--------|------+    |
                       |              |   |        +      |    |
JSC Source Code +----> | TSC & Rollup +--------> JSC (JS) |    |
                       |              |   |         +     |    |
                       +--------------+   |         |     |    |
                                          |         |     |    |
                          +---------------+         |     |    |
                          |                         |     <----+
                          |  +---------------+      |     |
                          |  |               |      |     |
WSVM Byte Codes <---------+  |    Node.JS    | <----+     |
                          |  |               |            |
                          |  +---------------+            |
                          |                               |
                          +-------------------------------+
                             JSC (Executed using Node.js)
```
