import {Component} from 'react'
import type {ReactNode} from 'react'
import {Dialog} from './Widgets'

export class MaterialLabBoundary extends Component<{children:ReactNode;onClose:()=>void},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){
  if(this.state.failed)return <Dialog open title="立体试色暂时未打开" onClose={this.props.onClose}><p className="dialog-intro">原工作台仍可继续使用。刷新页面后可以再试一次。</p><button className="primary" onClick={this.props.onClose}>返回工作台</button></Dialog>
  return this.props.children
 }
}
