#pragma strict

class GridNode{
	//Penalty & Score
	var gCost : short;
	var hCost : short;
	//Parent Node
	var parentNode : Vector3;
	//Closed List Representations
	var closed : byte;
}

class NodeSearch{
	var penalty : byte;
	var walkable : byte; //0 = Walkable /1 = Non-Walkable
}