declare module "acorn-walk" {
  import ESTree = require("estree");

  type ContinueCb<State> = (node: ESTree.Node, state: any) => void;
  type CallBack<State> = (
    node: ESTree.Node,
    state: any,
    c: ContinueCb<State>
  ) => void;
  type Vistors<State> = Partial<Record<ESTree.Node["type"], CallBack<State>>>;

  export function recursive<State>(
    node: ESTree.Node,
    state: State,
    funcs: Vistors<State>
  );
}
