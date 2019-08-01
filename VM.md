# WaterScript Virtual Machine

This document will cover some of the implementation details of the VM and also
there is a list of Byte Codes.

# Byte codes

We use `$(...)` to show a `push` and `$` for a `pop`, when there is a number
after the `$` like `$2 = $1` it just shows the order of pop, the given example
would produce the following code:

```
// $2 = $1
value = pop();
pointer = pop();
asgn(pointer, value);
```

Also we're using `CT` for the data that comes with the bytecode from the
constant pool.

## Data Stack Main Functions.

| Byte Code                 | Description    |
| ------------------------- | -------------- |
| Add                       | $($ + \$)      |
| Mul                       | $($ \* \$)     |
| Sub                       | $($ - \$)      |
| Div                       | $($ / \$)      |
| Mod                       | $($ % \$)      |
| Pow                       | $($ \*\* \$)   |
| BLS (Bitwise Left Shift)  | $($ << \$)     |
| BRS (Bitwise Right Shift) | $($ >> \$)     |
| BURS                      | $($ >>> \$)    |
| LT                        | $($ < \$)      |
| LTE                       | $($ <= \$)     |
| GT                        | $($ > \$)      |
| GTE                       | $($ >= \$)     |
| EQ                        | $($ == \$)     |
| IEQ                       | $($ != \$)     |
| EQS                       | $($ === \$)    |
| IEQS                      | $($ !== \$)    |
| BitOr                     | $($ \| \$)     |
| BitAnd                    | $($ & \$)      |
| BitXor                    | $($ ^ \$)      |
| BitNot                    | $(~$)          |
| And                       | $($ && \$)     |
| OR                        | $($ \| \$)     |
| Not                       | $(!$)          |
| Neg                       | $(-$)          |
| Pos                       | $(+$)          |
| Asgn                      | $2 = \$1       |
| Pop                       | \$             |
| Type                      | $(typeof \$)   |
| Void                      | Pop ; LdUndef  |
| LdUndef                   | \$(undefined)  |
| LdNull                    | \$(null)       |
| LdTrue                    | \$(true)       |
| LdFalse                   | \$(false)      |
| LdZero                    | \$(0)          |
| LdOne                     | \$(1)          |
| LdNaN                     | \$(NaN)        |
| LdInfinity                | \$(infinity)   |
| LdArr                     | \$([])         |
| LdObj                     | \$({})         |
| LdThis                    | \$(this)       |
| Dup                       | \$($, $)       |
| Prop                      | $($[$])        |
| InstanceOf                | $ instanceof $ |

## Data Stack with Constant Pool

| Byte Code | Entry Type | Description                          |
| --------- | ---------- | ------------------------------------ |
| IProp     | String     | $($[CT])                             |
| Load      | any wval   | \$(CT)                               |
| Named     | String     | Push the variable `CT` to the stack. |

## Control Flow

| Byte Code | Argument Type (Optional) | Description                  |
| --------- | ------------------------ | ---------------------------- |
| Jmp       | unsigned int             | Move to `pos`.               |
| JmpTrue   | unsigned int             | `$ is true`: Move to `pos`.  |
| JmpFalse  | unsigned int             | `$ is false`: Move to `pos`. |

## TODO

- [ ] Try catch
- [ ] Calls and arguments
- [ ] Jump tables (to implement switch)

# Calling Convention

To be written.
