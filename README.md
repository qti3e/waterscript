# WaterScript

> This project is still a work in progress, nothing works at this moment and
> it's just an idea.

WaterScript is a JavaScript engine that has a concurrent object model which can
be used to have different threads of the same program running sharing common
objects as well as ability to modify those objects.

The goal of this project is to provide a Code Excitation Simulator that would be
useful for various offline optimizations and code analysis.

It's not meant to be embedded in a JS runtime but to provide the ability to
**simulate** any JavaScript runtime.

## The idea

The main idea is being able to run JavaScript codes even when we do not know the
value of the variables by certain but we're able to describe them.  
It might be a bit strange at first but look at the example below.

## Example Script

```js
// preload.js

// `global`, `q` and `ws` are predefined in the preload scrips.

// Define a normal JavaScript function in the global scope that returns the sum
// of two numbers;
// - Nothing fancy is going on here.
global.add = function(x, y) {
  return x + y;
};

// Define a function called `random' that always returns a Q-FloatRange.
// Min of the returned range is -1 and its max is set to be 1.
global.random = q.Callable({
  returnType: q.FloatRange(-1, 1)
});

// Define a function called `input` that always returns a Q-String.
global.input = q.Callable({
  returnType: q.String()
});

// Define a variable called `var` which
// represents `True` and `False` at the same time.
global.var = q.Union(true, false);

// Define a normal global constant.
global.GR = 1.61803398875;

// Write the first parameter to the screen.
global.print = function(msg) {
  ws.write(msg + "\n");
};
```

Now using that preload we will run the following code:

```js
// main.js

if (var) {
  print("Entered the if statement body.");
} else {
  print("Entered the else statement body.");
}
```

The interesting fact is that you will see both of those messages when you run
your app using Water Script.
