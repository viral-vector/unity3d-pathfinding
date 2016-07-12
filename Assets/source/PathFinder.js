#pragma strict

import System.Collections.Generic;

//Path System Properties
enum HeuristicMode{Manhattan,Chebyshev,Euclidean,CrossPruduct}
var heuristicMode : HeuristicMode = HeuristicMode.Manhattan;

var collisionLayers : LayerMask;
var enemyLayers : LayerMask;
private var maskValue : int;
var collisionRadius : int = 1;
var heapMaxSize : int = 2000;
var requestQueueSize : int = 100;
var gridGraph : GridGraph;

//Search Properties
//private var neighborList : List.<Vector3>;
private	var openList : Heap;
private var nodeDictionary : Dictionary.<Vector3,GridNode>;
private var tmpSearch : NodeSearch;
private var tmpNode : GridNode;
private	var currentNode : Vector3; //Node We are looking at Currently

//Time Calculation
private var startTime : int;
private var endTime : int;
private var nodesExpanded : int = 0;
private var currentNodesExpanded : int = 0;
private var nodesSearched : int = 0;
private var updateFrames : int = 0;

//Path Optimization---------------
class Optimization{
	var diagonalMovement : boolean = true;
	var complexGCost : boolean = true;
	var maxNodesToExpand : int = 500; //If we dont find a path after 500 expansion return null
	var framesBetweenRequests : int = 0; //Process a Path every # of frames
	var expansionsPerFrame : int = 20; //Expand #of nodes every Update Cycle
}
var optimization : Optimization = new Optimization();
//---------------------------------

//Path Request---------------------
private class PathRequestClass{
	var start : Vector3;
	var end : Vector3;
	var target : Transform;
	var agent : AiPathAgent;
	
	function PathRequestClass(target : Transform,aiAgent : AiPathAgent){
		this.agent = aiAgent;
		this.target = target;
	}
}
private var pathing : boolean = false;
private var requestQueue : Queue.<PathRequestClass>;
private var currentRequest : PathRequestClass;
private var lastProceesFrame : int;
//----------------------------------
var debugMesseges : boolean = true;

function Start(){
	//Set Name So Agents Can Find This
	gameObject.name = "PathFinder";
	//Create a new Path Queue
	requestQueue = new Queue.<PathRequestClass>();
	//Create Storage
	nodeDictionary = new Dictionary.<Vector3,GridNode>();
	openList = new Heap(heapMaxSize); 
	//Zero out && null out everything
	pathing = false;
}

function Update(){
	//Cycle & Compute Path Requests
	if(!pathing){
		if(openList.Size() > 0 || nodeDictionary.Count > 0 || currentRequest != null){
			openList.Clear();
			nodeDictionary.Clear();
			currentRequest = null;
		}
		
		if(requestQueue.Count > 0 && Time.frameCount > lastProceesFrame){ //Process Next Request
			currentRequest = requestQueue.Dequeue();
			
			currentRequest.start = currentRequest.agent.transform.position; //Path from requester current position
			currentRequest.end = currentRequest.target.position; //Path to target current position
			
			StartPathCalculation(currentRequest);
			lastProceesFrame = Time.frameCount + optimization.framesBetweenRequests;
		}
	}else{
		if(currentRequest != null){ //Do # of cycles per frame
			updateFrames++; //New Cycles (currentNodesExpanded/cycles)
			CalculatePath(currentRequest.start,currentRequest.end);
		}
	}
}

function RequestPath(target : Transform,aiAgent : AiPathAgent){
	if(requestQueue.Count < requestQueueSize){
		//Add Path Request To Process Queue
		requestQueue.Enqueue(new PathRequestClass(target,aiAgent));
	}else{
		//Return No Path to Calling Agent
		aiAgent.RecievePath(null);
	}
}

private function StartPathCalculation(request : PathRequestClass){
	//Check if In-Bounds
	if(!gridGraph.IsInBounds(request.start)){
		if(debugMesseges){
			Debug.Log("A Node is Outside Bounds"); 
		}
		currentRequest.agent.RecievePath(null); //Send Null Immediate
		pathing = false;
		return;
	}
	//Reset Time & Calculations
	nodesExpanded = 0;
	nodesSearched = 0;
	startTime = Time.realtimeSinceStartup;
	updateFrames = 0;
	
	//Initialize Open List (Add Start & End Nodes)
	tmpNode = new GridNode();
	tmpNode.gCost = 0;
	tmpNode.hCost = CalculateHeuristic(request.start,request.end,request.start);
	nodeDictionary.Add(request.start,tmpNode);
	openList.Push(request.start,nodeDictionary); //Initialize Heap
	
	//We are pathing now
	pathing = true; 
}

function CalculatePath(startNode : Vector3,endNode : Vector3){ //Calculate Path	
	//Reset Count of Nodes Expanded this frame
	currentNodesExpanded = 0; 
	//Local Containers
	tmpNode = new GridNode();
	tmpSearch = new NodeSearch();
	//Run Loop
	while(openList.Size() > 0 && (currentNodesExpanded <= optimization.expansionsPerFrame)){
		//Let's not exceed max node searched
		if(nodesExpanded >= optimization.maxNodesToExpand){
			endTime = Time.realtimeSinceStartup;
			ReturnPath(currentNode,startNode,nodeDictionary,true); //Recunstruct Semi-Path & Return 
		}
		//Expand Nodes
		nodesExpanded++;
		//Keep Tally for this frame
		currentNodesExpanded++;
		//Get Lowest Cost Node
		currentNode = openList.Pop(nodeDictionary);
		//If current Node is 1 Grid Space Near Goal Position
		if((Mathf.Abs(currentNode.x - endNode.x) <= gridGraph.gridSpacing) && (Mathf.Abs(currentNode.z - endNode.z) <= gridGraph.gridSpacing)){
			ReturnPath(currentNode,startNode,nodeDictionary,false); //Recunstruct Path & Return
		}
		//Mark as closed
		nodeDictionary[currentNode].closed = 1;
		//Scan Each Neighbor
		for(var node : Vector3 in gridGraph.GetNeighbors(currentNode.x,currentNode.z,optimization.diagonalMovement)){
			tmpSearch = SearchNode(node,collisionRadius,gridGraph.gridHeight,collisionLayers);
			//Check if Neighbor is walkable
			if(tmpSearch.walkable == 1){continue;}
			//If Not In Open List
			if(!nodeDictionary.ContainsKey(node)){
				//Create Tmp Node
				tmpNode = new GridNode(); 
				//Create a Disctionary Entry
				tmpNode.parentNode = currentNode;//Set Parent Node
				tmpNode.gCost = nodeDictionary[currentNode].gCost + CalculateBaseCost(node,currentNode) + tmpSearch.penalty;
				tmpNode.hCost = CalculateHeuristic(startNode,endNode,node);
				//Add To Disctionary & Heap
				nodeDictionary.Add(node,tmpNode); //Add to Dictionary	
				openList.Push(node,nodeDictionary); //Add To Heap
				//Increment Nodes Searched
				nodesSearched++;		
			}//Node in Open List
			else{
				//If G-Cost is lower /Set New G-Cost & Parent
				if(nodeDictionary[node].closed == 0){
					if(nodeDictionary[node].gCost > nodeDictionary[currentNode].gCost + CalculateBaseCost(node,currentNode)){ //Do not add penalty for ai Here
						nodeDictionary[node].parentNode = currentNode;//Set Parent Node
						nodeDictionary[node].gCost = nodeDictionary[currentNode].gCost + CalculateBaseCost(node,currentNode) + tmpSearch.penalty;
						//Update Node Dictionary
						openList.UpdateNode(node,nodeDictionary);
					}
				}	
			}
		}
	}
	
	if(openList.Size() == 0){
		endTime = Time.realtimeSinceStartup;
		if(debugMesseges){
			Debug.Log("Found No Path [Time = " + (endTime-startTime) + "] " + nodesExpanded + " Nodes Expanded [" + nodesSearched +"]" + "[Cycles : "+updateFrames+"]");
		}
		//Return No Path
		currentRequest.agent.RecievePath(null);
		//Stop Pathing
		pathing = false;
	}
}

private function ReturnPath(endNode : Vector3, startNode : Vector3, searchDictionary : Dictionary.<Vector3,GridNode>,semi : boolean){
	var node : Vector3 = endNode; //Start At EndNode
	var pathNode : Vector3 = new Vector3(); //Start At EndNode
	var path : List.<Vector3> = new List.<Vector3>();
	
	while(searchDictionary.ContainsKey(node) && searchDictionary[node].parentNode != null){
		pathNode.x = node.x; 
		pathNode.z = node.z;
		pathNode.y = gridGraph.transform.position.y;
		path.Add(pathNode);//Add This To front
		//Move to Next Node
		node = searchDictionary[node].parentNode;	
	}
	
	pathNode.x = startNode.x; 
	pathNode.z = startNode.z; 
	path.Add(pathNode);//Add This To front
	
	endTime = Time.realtimeSinceStartup;
	//Display MSG
	if(debugMesseges){
		if(semi){
			Debug.Log("Found Semi-Path: "+path.Count+" Nodes [Time = " + (endTime-startTime) + "] " + nodesExpanded + " Nodes Expanded [" + nodesSearched +"]" + "[# Frames : "+updateFrames+"]");
		}else{
			Debug.Log("Found Path: "+path.Count+" Nodes [Time = " + (endTime-startTime) + "] " + nodesExpanded + " Nodes Expanded [" + nodesSearched +"]" + "[# Frames : "+updateFrames+"]");
		}
	}
	//Reverse The Path
	path.Reverse();
	//Send Path Back To Agent
	currentRequest.agent.RecievePath(path);
	//Stop Pathing
	pathing = false;
}

private function CalculateHeuristic(startNode : Vector3,endNode : Vector3,currentNode : Vector3): int{	
	var heuristic : int;
	if(heuristicMode == HeuristicMode.Manhattan){//Manhatt
		heuristic = Mathf.Abs(currentNode.x - endNode.x) + Mathf.Abs(currentNode.z - endNode.z);
	}else if(heuristicMode == HeuristicMode.Chebyshev){//Chebyshev
		heuristic = Mathf.Max(Mathf.Abs(currentNode.x - endNode.x),Mathf.Abs(currentNode.z - endNode.z));	
	}else if(heuristicMode == HeuristicMode.Euclidean){//Eucludian
		heuristic = Mathf.Sqrt(Mathf.Pow((currentNode.x - endNode.x),2) + Mathf.Pow((currentNode.z - endNode.z),2));	
	}else if(heuristicMode == HeuristicMode.CrossPruduct){//Cross Product
       	var A : int = (currentNode.x - endNode.x)*(startNode.z - currentNode.z);
        var B : int = (startNode.x - currentNode.x)*(currentNode.z - endNode.z);
        var C : int = (A)-(B);
        if(C < 0) C *= -1; // Absolute Value

        heuristic = (Mathf.Abs(currentNode.x - endNode.x) + Mathf.Abs(currentNode.z - endNode.z) + C * 0.0002);
	}
	heuristic *= (1.0 + 1/1000);
	return heuristic;
}

private function CalculateBaseCost(node : Vector3,fromNode : Vector3) : int{
	if(optimization.complexGCost){
		return Mathf.Abs(node.x - fromNode.x) + Mathf.Abs(node.z - fromNode.z); 
	}
	return 1; 
}

private function SearchNode(node : Vector3,radius : int,height : int,obstacleLayers : LayerMask) : NodeSearch{
	var nodeS = new NodeSearch();
	
	if(!gridGraph.IsInBounds(node) || Physics.CheckCapsule(node + (Vector3.up * .5),node + (Vector3.up * height),radius,obstacleLayers)){
		nodeS.walkable = 1; 
	}
	if((Physics.OverlapSphere(node,radius,enemyLayers)).Length > 0){
		nodeS.penalty = 5;
	}
	
	return nodeS;
}

@script AddComponentMenu ("FPX/PathFinding/PathFinder")