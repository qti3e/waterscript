declare module "acorn-walk" {
  import ESTree = require("estree");

  type ContinueCb<State> = (node: ESTree.Node, state: State) => void;

  type CallBack<State, Node> = (
    node: Node,
    state: State,
    c: ContinueCb<State>
  ) => void;

  type Extract<
    Base,
    Key extends keyof Base,
    T extends Base[Key]
  > = Base extends Record<Key, T> ? Base : never;

  type Visitor<State, T extends ESTree.Node> = CallBack<State, T>;

  type Visitors<State> = {
    [K in ESTree.Node["type"]]: Visitor<State, Extract<ESTree.Node, "type", K>>
  };

  export function recursive<State>(
    node: ESTree.Node,
    state: State,
    funcs: Partial<Visitors<State>>
  ): void;
}
