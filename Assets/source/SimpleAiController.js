#pragma strict

import System.Collections.Generic;

class SimpleAiController extends PathReceiver{
	
	//Movement & Turning Speeds
	var moveSpeed : int = 5;
	var turnSpeed : int = 5;
	var minApproachDistance : float = 1;
	//Pathing Options
	var pathAgent : AiPathAgent;
	var repathFrequency : float = .25;
	protected var repathTimer : float;
	protected var currentPathIndex : int = 0;
	protected var faceTarget : boolean = true;
	//Transform Refrence
	protected var myTransform : Transform;
	//Target
	var target : Transform;
	
	function Start () {
		myTransform = transform;
		currentPath	= new List.<Vector3>();
		repathTimer = Time.time + 2;
	}
	
	function Update () {
		Movement();
	}
	
	protected function Movement (){
		if(Time.time > repathTimer){
			pathAgent.RequestPath(target,this); 
			repathTimer = Time.time + repathFrequency + (Random.value * .25); //Add A Random Value  
		}
		if(currentPath != null && currentPath.Count > 0){	
			if(Mathf.Abs(myTransform.position.x - currentPath[currentPathIndex].x) < minApproachDistance && 
				Mathf.Abs(myTransform.position.z - currentPath[currentPathIndex].z) < minApproachDistance){
				currentPathIndex++; 
				currentPathIndex = Mathf.Clamp(currentPathIndex,0,currentPath.Count-1);
			}else{
				if(Vector3.SqrMagnitude(myTransform.position - target.position) > minApproachDistance){
					//Face next pos
					faceTarget = false;
					var relativePos : Vector3 = currentPath[currentPathIndex] - myTransform.position;
					var rot = Quaternion.LookRotation(relativePos,Vector3.up);
					var myRot = myTransform.rotation;
					myRot = Quaternion.Slerp(myRot,rot,Time.deltaTime * turnSpeed * 2);
					myRot.x = 0;
					myRot.z = 0;
					myTransform.rotation = myRot; //Set New Rot	
					
					relativePos = new Vector3(currentPath[currentPathIndex].x, myTransform.position.y, currentPath[currentPathIndex].z);
					myTransform.position = Vector3.MoveTowards(myTransform.position,relativePos,Time.deltaTime * moveSpeed); //Time.timeScle allows for slow game speed sync

				}else{
					//Should we face the target
					if(CanReallySeeTarget()){faceTarget = true;} 
					else faceTarget = false;
				}
			}
		}else{
			if(CanReallySeeTarget()){faceTarget = true;}
			else faceTarget = false;
		}
		
		if(faceTarget) FaceTarget(); //When we need to face the target
	}
	
	protected function FaceTarget(){
		var relativePos = target.position - myTransform.position;
		var rot = Quaternion.LookRotation(relativePos,Vector3.up);
		var myRot = myTransform.rotation;
		myRot = Quaternion.Slerp(myRot,rot,Time.deltaTime * turnSpeed * 2);
		myRot.x = 0;
		myRot.z = 0;
		myTransform.rotation = myRot; //Set New Rot	
	}
	
	protected function CanReallySeeTarget(){
		if(Physics.Linecast(myTransform.position,target.position)){
			return false;
		}
		return true;
	}
	
	override function RecievePath(path : List.<Vector3>){
		currentPath = path;
		currentPathIndex = 0;
	}
}
@script AddComponentMenu ("ViralVector/PathFinding/SimpleAiController")