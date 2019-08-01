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
| 0x1b | Asgn                      | $2 = \$1       |
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
| 0x2a | Dup                       | \$($, $)       |
| 0x2b | Prop                      | $($[$])        |
| 0x2c | InstanceOf                | $ instanceof $ |

## Data Stack with Constant Pool

| Hex  | Byte Code | Entry Type | Description                          |
| ---- | --------- | ---------- | ------------------------------------ |
| 0x40 | IProp     | String     | $($[CT])                             |
| 0x41 | Load      | any wval   | \$(CT)                               |
| 0x42 | Named     | String     | Push the variable `CT` to the stack. |

## Control Flow

| Hex  | Byte Code | Argument Type (Optional) | Description                  |
| ---- | --------- | ------------------------ | ---------------------------- |
| 0x70 | Jmp       | unsigned int             | Move to `pos`.               |
| 0x71 | JmpTrue   | unsigned int             | `$ is true`: Move to `pos`.  |
| 0x72 | JmpFalse  | unsigned int             | `$ is false`: Move to `pos`. |

## TODO

- [ ] Try catch
- [ ] Calls and arguments
- [ ] Jump tables (to implement switch)

# Calling Convention

To be written.
