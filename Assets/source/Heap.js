#pragma strict

import System.Collections.Generic;

class Heap{
	protected var list : List.<Vector3>;
	protected var maxSize : int;
	
	//Initialize Heap
	function Heap(max : int){
		maxSize = max;
		list = new List.<Vector3>();
	}
	
	function Size() : int{
		return list.Count;
	}
	
	function Clear(){
		list.Clear();
	}
	
	function UpdateNode(node : Vector3,nD : Dictionary.<Vector3,GridNode>){
		//Debug.Log("UPDATING" + Time.deltaTime);
		var nodePos : int = list.IndexOf(node);
		SiftDown(0, nodePos, nD);
    	SiftUp(nodePos, nD); //We are reducing fcost so only sift up
	}
	
	function Push(node : Vector3, nD : Dictionary.<Vector3,GridNode>){//Add A Node
		if(list.Count > maxSize){ //Lets not exceed in size
			//nD.Remove(list[list.Count-1]);
			list.RemoveAt(list.Count-1);
		}
		//Add Node
		list.Add(node);
		//Sift Up
		SiftUp(list.Count -1,nD);
	}
	
	function Pop(nD : Dictionary.<Vector3,GridNode>): Vector3{//Romove Top Node
		var returnNode : Vector3;
		if(list.Count == 1){
			returnNode = list[0];
			list.RemoveAt(list.Count-1);	
		}else if(list.Count > 1){
			returnNode = list[0];
			
			list[0] = list[list.Count-1];
			list.RemoveAt(list.Count-1);
			
			SiftDown(0,0,nD);
		}
		return returnNode;
	}
	
	private function SiftUp(siftNode : int,nD : Dictionary.<Vector3,GridNode>){
		var tmpNode : Vector3;
		//Sift Up
		while(siftNode > 0){
			if(CompareTo(list[siftNode],list[Mathf.FloorToInt((siftNode-1)/2)],nD) == -1){//Smaller than parent
				tmpNode = list[siftNode];
				list[siftNode] = list[Mathf.FloorToInt((siftNode-1)/2)];
				list[Mathf.FloorToInt((siftNode-1)/2)] = tmpNode;
				siftNode = Mathf.FloorToInt((siftNode-1)/2);
			}else{siftNode = 0; break;} //We are bigger than parent
		}
	}
	
	private function SiftDown(siftNode : int,childNode : int,nD : Dictionary.<Vector3,GridNode>){
		//Sift Down	
		var siftingDwn : boolean = true;
		var tmpNode : Vector3;
		while(siftingDwn){
			if(list.Count > (2*siftNode+1)){ //Both Children
				if(CompareTo(list[2*siftNode+1],list[2*siftNode],nD) == -1){
					childNode = 2*siftNode+1; //Second Child smaller
				}else{childNode = 2*siftNode;}//First Child smaller
			}else if(list.Count > (2*siftNode)){ //One Child
				childNode = 2*siftNode;	//No Comparison btw children. Use first Child
			}else{siftingDwn = false; break;}//No Children
			//Compare childnode with parent
			if(CompareTo(list[childNode],list[siftNode],nD) == -1){//Parent is bigger
				tmpNode = list[siftNode];
				list[siftNode] = list[childNode];
				list[childNode] = tmpNode;
				siftNode = childNode;
			}else{siftingDwn = false; break;} //We are bigger than parent
		}	
	}
	
	private function CompareTo(compareNode : Vector3,compareToNode : Vector3,nD : Dictionary.<Vector3,GridNode>):int{//Node Compare Method
		if((nD[compareNode].hCost + nD[compareNode].gCost) >= (nD[compareToNode].hCost + nD[compareToNode].gCost)){
			return 1;
		}else{return -1;}		
	}
	
	function ToString(nD : Dictionary.<Vector3,GridNode>): String{ //Return Heap Contents
		var outPut : String = "";
		for(var node : Vector3 in list){
			outPut += nD[node].hCost + nD[node].gCost + ","; 	
		}return outPut;
	}
} 