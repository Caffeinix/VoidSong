# Operations

This directory contains classes that operate on model objects.  In order to make it easier to create
immutable versions of the model objects and clone them, and to avoid unnecessary allocation, we use 
a C-style API for these operations: all methods of the classes are static, and they take the 
relevant model object as their first parameter.

Ships and ship systems typically contain at least three standard operations:

-   `clone`: creates a mutable copy of the ship or system.
-   `update`: processes any pending user commands that should change the state of the ship or 
    system, and generates new snapshots of the ship based on those changes.  This is used for things
    like changes in thrust or torque, beginning to charge the jump drive or jumping the ship, and
    other active operations.
-   `simulate`: performs physics simulation of the ship or system through some amount of elapsed
    time. Unlike `update`, this cannot generate new snapshots, and is used for things like power
    distribution, heat transfer, and acceleration due to thrust or gravity.