# WaterScript Virtual Machine

This document will cover some of the implementation details of the VM and also
there is a list of Byte Codes.

# Byte codes

We use `$(...)` to show a `push` and `$` for a `pop`, when there is a number
after the `$` like `$2 = $1` it just shows the order of pop, the given example
would produce the following code:

```js
// $2 = $1
value = pop();
pointer = pop();
asgn(pointer, value);
```

Also we're using `CT` for the data that comes with the bytecode from the
constant pool.

And there is `#` for `peek()`

## Data Stack Main Functions.

| Hex  | Byte Code                 | Description    |
| ---- | ------------------------- | -------------- |
| 0x01 | Add                       | $($ + \$)      |
| 0x02 | Mul                       | $($ \* \$)     |
| 0x03 | Sub                       | $($ - \$)      |
| 0x04 | Div                       | $($ / \$)      |
| 0x05 | Mod                       | $($ % \$)      |
| 0x06 | Pow                       | $($ \*\* \$)   |
| 0x07 | BLS (Bitwise Left Shift)  | $($ << \$)     |
| 0x08 | BRS (Bitwise Right Shift) | $($ >> \$)     |
| 0x09 | BURS                      | $($ >>> \$)    |
| 0x0a | LT                        | $($ < \$)      |
| 0x0b | LTE                       | $($ <= \$)     |
| 0x0c | GT                        | $($ > \$)      |
| 0x0d | GTE                       | $($ >= \$)     |
| 0x0e | EQ                        | $($ == \$)     |
| 0x0f | IEQ                       | $($ != \$)     |
| 0x10 | EQS                       | $($ === \$)    |
| 0x11 | IEQS                      | $($ !== \$)    |
| 0x12 | BitOr                     | $($ \| \$)     |
| 0x13 | BitAnd                    | $($ & \$)      |
| 0x14 | BitXor                    | $($ ^ \$)      |
| 0x15 | BitNot                    | $(~$)          |
| 0x16 | And                       | $($ && \$)     |
| 0x17 | OR                        | $($ \| \$)     |
| 0x18 | Not                       | $(!$)          |
| 0x19 | Neg                       | $(-$)          |
| 0x1a | Pos                       | $(+$)          |
| 0x1b | Asgn                      | $2 = $(\$1)    |
| 0x1c | Pop                       | \$             |
| 0x1d | Type                      | $(typeof \$)   |
| 0x1e | Void                      | Pop ; LdUndef  |
| 0x1f | LdUndef                   | \$(undefined)  |
| 0x20 | LdNull                    | \$(null)       |
| 0x21 | LdTrue                    | \$(true)       |
| 0x22 | LdFalse                   | \$(false)      |
| 0x23 | LdZero                    | \$(0)          |
| 0x24 | LdOne                     | \$(1)          |
| 0x25 | LdNaN                     | \$(NaN)        |
| 0x26 | LdInfinity                | \$(infinity)   |
| 0x27 | LdArr                     | \$([])         |
| 0x28 | LdObj                     | \$({})         |
| 0x29 | LdThis                    | \$(this)       |
| 0x2a | Dup                       | \$(#)          |
| 0x2b | Prop                      | $($[$])        |
| 0x2c | InstanceOf                | $ instanceof $ |
| 0x2d | In                        | $ in $         |
| 0x2e | Next                      | \$(#.next())   |
| 0x2f | ArPush                    | #2.push(\$1)   |
| 0x30 | LdTwo                     | \$(2)          |
| 0x31 | Del                       | delete \$      |
| 0x32 | ComputedRef               | $(Ref($, \$))  |
| 0x33 | UnRefDup                  | \$(UnRef(#))   |
| 0x34 | PostfixUpdateAdd          | i++            |
| 0x35 | PostfixUpdateSub          | i--            |
| 0x36 | PrefixUpdateAdd           | ++i            |
| 0x37 | PrefixUpdateSub           | --i            |

## Data Stack with Constant Pool

A reference to the constant pool is a Uint32.

| Hex  | Byte Code  | Entry Type | Description                                |
| ---- | ---------- | ---------- | ------------------------------------------ |
| 0x40 | LdStr      | String     | Push the netstr at `CT` to the data stack. |
| 0x41 | NamedProp  | String     | $($[`CT`])                                 |
| 0x42 | Named      | String     | Push the variable `CT` to the stack.       |
| 0x43 | Store      | String     | `CT` = #                                   |
| 0x44 | Var        | String     | def `CT` = undefined                       |
| 0x45 | Let        | String     | Var(`CT`) ; Store(`CT`)                    |
| 0x46 | SetIsConst | String     | Set `isConstant` flag on `CT` on.          |
| 0x47 | Const      | String     | Let(`CT`) ; SetIsConst(`CT`)               |
| 0x48 | NamedRef   | String     | RefStart; Named(`CT`); RefEnd;             |
| 0x49 | PropRef    | String     | RefStart; NamedProp(`CT`); RefEnd;         |
| 0x4a | RegExp     | String     | Create a RegExp with the given pattern.    |

> Note `Let` and `Const` sets the `lexical-deceleration` flag to true.

> Var stores value to the global object to.

> `var`, `let` and `const` each correspond to their behavior in the JavaScript
> itself.

## Control Flow

<table>
<thead>
<tr>
  <td><b>Hex</b></td>
  <td><b>Name</b></td>
  <td><b>Argument Type</b></td>
  <td><b>Description</b></td>
</tr>
</thead>

<tr>
  <td>0x70</td>
  <td>Jmp</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
cursor = arg;
</pre>
  </td>
</tr>

<tr>
  <td>0x71</td>
  <td>JmpTruePop</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = pop();
if (value) {
  cursor = arg;
}
</pre>
  </td>
</tr>

<tr>
  <td>0x72</td>
  <td>JmpFalsePop</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = pop();
if (!value) {
  cursor = arg;
}
</pre>
  </td>
</tr>

<tr>
  <td>0x73</td>
  <td>JmpTruePeek</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = peek();
if (value) {
  cursor = arg;
}
</pre>
  </td>
</tr>

<tr>
  <td>0x74</td>
  <td>JmpFalsePeek</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = peek();
if (!value) {
  cursor = arg;
}
</pre>
  </td>
</tr>

<tr>
  <td>0x75</td>
  <td>JmpTrueThenPop</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = peek();
if (value) {
  pop();
  cursor = arg;
}
</pre>
  </td>
</tr>

<tr>
  <td>0x76</td>
  <td>JmpFalseThenPop</td>
  <td>unsigned int</td>
  <td>
<pre lang="js">
const value = peek();
if (!value) {
  pop();
  cursor = arg;
}
</pre>
  </td>
</tr>

</table>

# Hoisting and Scoping

| Hex  | Name       | Description                                   |
| ---- | ---------- | --------------------------------------------- |
| 0x90 | LdScope    | Load the scope for the current section.       |
| 0x91 | Ret        | Return from a function.                       |
| 0x92 | FunctionIn | Push a new Function scope to the scope chain. |
| 0x93 | BlockOut   | Pop the last Block scope on the scope chain.  |
| 0x94 | BlockIn    | Push a new Block scope to the scope chain.    |

# Byte codes with fixed size arguments

| Hex  | Name       | Arg size | Description                           |
| ---- | ---------- | -------- | ------------------------------------- |
| 0xa0 | LdFunction | 2 bytes  | Load function from the functions set. |
| 0xa1 | LdFloat32  | 4 bytes  | Load a float 32 value.                |
| 0xa2 | LdFloat64  | 8 bytes  | Load a float 64 value.                |
| 0xa3 | LdInt32    | 4 bytes  | Load a int 32 value.                  |
| 0xa4 | LdUint32   | 4 bytes  | Load a unsigned int 32 value.         |

# Calls

| Hex  | Name    | Description                           |
| ---- | ------- | ------------------------------------- |
| 0xc0 | Call0   | Call \$ without any parameters.       |
| 0xc1 | Call1   | Call \$ with only one parameters.     |
| 0xc2 | Call2   | Call \$ with two parameters.          |
| 0xc3 | Call3   | Call \$ with three parameters.        |
| 0xc4 | Call    | Call \$ with a argument object.       |
| 0xc5 | NewArg  | Push a new argument object to the ds. |
| 0xc6 | PushArg | arg = $, pushArg(#, $)                |
| 0xd0 | New0    | Like Call0 but create a new instance. |
| 0xd1 | New1    | Like Call1 but create a new instance. |
| 0xd2 | New2    | Like Call2 but create a new instance. |
| 0xd3 | New3    | Like Call3 but create a new instance. |
| 0xd4 | New     | Like Call but create a new instance.  |

## TODO

- [ ] Try catch
- [ ] Jump tables (to implement switch)

# Calling Convention

To be written.
