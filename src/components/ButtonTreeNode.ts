import {TreeNode} from "rsuite/cjs/internals/Tree/types";

export const ButtonTreeNode: (id: string) => TreeNode = (id: string) => {
    return {
        value: `${id}-button`,
        label: `button@${id}`
    }
}