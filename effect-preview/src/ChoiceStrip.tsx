import {useId} from 'react'

type Choice<T extends string>={value:T;label:string;description?:string}
type Props<T extends string>={label:string;value:T;options:readonly Choice<T>[];onChange:(value:T)=>void;disabled?:boolean;className?:string}

export function ChoiceStrip<T extends string>({label,value,options,onChange,disabled=false,className=''}:Props<T>){
 const labelId=useId()
 return <div className={`choice-strip-field ${className}`}>
  <span className="choice-strip-label" id={labelId}>{label}</span>
  <div className="choice-strip" role="group" aria-labelledby={labelId}>
   {options.map(option=><button type="button" key={option.value} disabled={disabled} aria-pressed={value===option.value} aria-label={option.description||option.label} onClick={()=>onChange(option.value)}>
    <span className="choice-strip-mark" aria-hidden="true"/>
    <span>{option.label}</span>
   </button>)}
  </div>
 </div>
}
