# Model

This directory contains interfaces for model objects.  

Model objects are simple data structures (using JSON-compatible types) representing the state of the 
game world.  They are used by the renderer to display the world on screen, by the snapshot manager 
to save and recall the state of ships at various points of time, by the updater and physics engine 
to determine the current state of ships and their systems, and basically everywhere else.

## Operations

Most model objects are associated with an _operations class_, which provides a C-style API for 
working with model objects of that type.  They can be found in the `operations` directory.

## Mutability

Model objects are used in two modes, mutable and immutable.  Mutable model objects are used when 
making changes to the world by adding a new snapshot to the snapshot manager, whereas immutable 
model objects are used when rendering and simulating physics.  This helps ensure that we never 
accidentally mutate a model object without capturing that change in a snapshot.  We use the 
`DeepReadonlyObject` class to specify that an immutable object is required.  You can always get a 
mutable copy of any model object by passing it to the `clone()` function defined in its operation 
class.