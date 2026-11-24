import {Children,isValidElement,Fragment,type ReactNode} from "react";
/** React JSX conditionals often produce [null,false]. They are not decisions. */
export function visibleDialogueChoices(children:ReactNode):ReactNode[]{
 return Children.toArray(children).flatMap(child=>{
  if(isValidElement<{children?:ReactNode}>(child)&&child.type===Fragment)
   return visibleDialogueChoices(child.props.children);
  return [child];
 });
}
