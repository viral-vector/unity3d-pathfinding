#pragma strict

import System.Collections.Generic;

enum SmoothingType{UnSmoothed,Raycast,Funnel}
var smoothing : SmoothingType = SmoothingType.UnSmoothed;

var yieldForResponse : boolean = true;

private var pathFinder : PathFinder;
private var returnPathTo : PathReceiver;
private var myTransform : Transform;
private var recievedResponse : byte = 0;

private var lastPath : List.<Vector3>;

var showPath : boolean = true;

function Start (){
	myTransform = transform;
}

function LateUpdate(){
	if(!pathFinder){
		pathFinder = GameObject.Find("PathFinder").GetComponent(PathFinder);//Locate PathFinder
	}
}

function RequestPath(toTarget : Transform,controller : PathReceiver){
	returnPathTo = controller;
	if(pathFinder){
		if(yieldForResponse){ //We want to recieve a response to past requests first
			if(recievedResponse == 0){ //We already recived a response
				recievedResponse = 1; //wait for response
				pathFinder.RequestPath(toTarget,this);	
			}
		}else{
			pathFinder.RequestPath(toTarget,this);
		}
	}
}

function RecievePath(path : List.<Vector3>){
	//We can send new Requests
	recievedResponse = 0; 
	//Dont pass null path
	if(path == null)return;  
	//New Last Path
	lastPath = path;
	//Smoothe the Path
	if(smoothing == SmoothingType.Raycast){
		lastPath = RaycastSmoothe(lastPath); //Return Smoothed Path
	}else if(smoothing == SmoothingType.Funnel){
		lastPath = FunnelSmoothe(lastPath); //Return Smoothed Path
	}
	//Return Path To the Controller
	returnPathTo.RecievePath(lastPath);
}

private function FunnelSmoothe(path : List.<Vector3>): List.<Vector3>{
	return path;
}

private function RaycastSmoothe(path : List.<Vector3>): List.<Vector3>{
	if(path == null || path.Count < 1)return path;
	
	var finalPath : List.<Vector3> = new List.<Vector3>();
	finalPath.Add(path[0]);//Add First Point
	var currentPoint : int = 0;
	
	for(var i : int = currentPoint; i < path.Count; i++){
		if(Physics.Linecast(path[currentPoint],path[i])){
			currentPoint = i-1;
			finalPath.Add(path[i-1]);
		}
	}
	finalPath.Add(path[path.Count-1]);//Add Last Point
	return finalPath;
}

function OnDrawGizmos(){
	if(pathFinder){
		Gizmos.color = Color.red;
		Gizmos.DrawWireSphere(transform.position,pathFinder.collisionRadius);
	}else{
		Gizmos.color = Color.yellow;
		Gizmos.DrawWireSphere(transform.position,1);
	}
	if(showPath && (lastPath != null && lastPath.Count > 0)){
		var vectPt1 : Vector3 = transform.position;
		var vectPt2 : Vector3 = transform.position;
		for(var i : int = 0; i < lastPath.Count; i++){
			Gizmos.color = Color.red;
			vectPt1 = lastPath[i];
			if(lastPath.Count > i+1){
				vectPt2 = lastPath[i+1];
			}else{
			 	vectPt2 = vectPt1;
			}
			Gizmos.DrawLine(vectPt1,vectPt2);
		}
	}
}

@script AddComponentMenu ("ViralVector/PathFinding/AIPathAgent")