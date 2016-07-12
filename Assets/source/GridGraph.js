import System.Collections.Generic;

@script ExecuteInEditMode()

var gridSizeX : int = 100;
var gridSizeZ : int = 100;
var gridSpacing : int = 2;
var gridHeight : int = 2;
		
//General Options
var showGrid : boolean = false;

function Update(){
	//Keep Units in Ints for better #s game
	transform.position.x = Mathf.CeilToInt(transform.position.x);
	transform.position.z = Mathf.CeilToInt(transform.position.z);
}

function IsInBounds(x : int, z : int) : boolean{
	return IsInBounds(new Vector3(x,transform.position.y,z));	
}

function IsInBounds(node : Vector3) : boolean{
	return (node.x > Left() && node.x < Right() && node.z < Top() && node.z > Bottom());	
}

function GetNeighbors(x : int, z : int, getDiagonals : boolean): List.<Vector3>{
	var nbrs = new List.<Vector3>();
    // ↑
    if (IsInBounds(x, z - gridSpacing)) {
        nbrs.Add(new Vector3(x,transform.position.y,z - gridSpacing));
    }
    // →
    if (IsInBounds(x + gridSpacing, z)) {
        nbrs.Add(new Vector3(x + gridSpacing,transform.position.y,z));
    }
    // ↓
    if (IsInBounds(x, z + gridSpacing)) {
        nbrs.Add(new Vector3(x,transform.position.y,z + gridSpacing));
    }
    // ←
    if (IsInBounds(x - gridSpacing,z)) {
        nbrs.Add(new Vector3(x - gridSpacing,transform.position.y,z));
    }
    if(getDiagonals){
	    // ↖
	    if (IsInBounds(x - gridSpacing, z - gridSpacing)) {
	        nbrs.Add(new Vector3(x - gridSpacing,transform.position.y,z - gridSpacing));
	    }
	    // ↗
	    if (IsInBounds(x + gridSpacing, z - gridSpacing)) {
	        nbrs.Add(new Vector3(x + gridSpacing,transform.position.y,z - gridSpacing));
	    }
	    // ↘
	    if (IsInBounds(x + gridSpacing, z + gridSpacing)) {
	        nbrs.Add(new Vector3(x + gridSpacing,transform.position.y,z + gridSpacing));
	    }
	    // ↙
	    if (IsInBounds(x - gridSpacing, z + gridSpacing)) {
	        nbrs.Add(new Vector3(x - gridSpacing,transform.position.y,z + gridSpacing));
	    }
    }
    return nbrs;
}

private function Width() : float{
	return (gridSizeX * gridSpacing); 
}

private function Height() : float{
	return (gridSizeZ * gridSpacing); 
}

private function Left() : float{
	return transform.position.x; 
}

private function Right() : float{
	return transform.position.x + Width(); 
}

private function Top() : float{
	return transform.position.z + Height(); 
}

private function Bottom() : float{
	return transform.position.z; 
}

function OnDrawGizmos(){
	var desPosa : Vector3 = transform.position;
	var desPosb : Vector3 = transform.position;
	//Show Grid Bounderies
	Gizmos.color = Color.green;
	
	desPosa = transform.position;
	desPosb = transform.position; desPosb.x += Width();
	Gizmos.DrawLine(desPosa,desPosb); desPosa.y += gridHeight; desPosb.y += gridHeight; Gizmos.DrawLine(desPosa,desPosb); 
	Gizmos.DrawLine(new Vector3(desPosa.x,desPosa.y - gridHeight,desPosa.z),desPosa);
	
	desPosa.y = transform.position.y; desPosb.y = transform.position.y; desPosa = desPosb;
	desPosb.z += Height();
	Gizmos.DrawLine(desPosa,desPosb); desPosa.y += gridHeight; desPosb.y += gridHeight; Gizmos.DrawLine(desPosa,desPosb);
	Gizmos.DrawLine(new Vector3(desPosa.x,desPosa.y - gridHeight,desPosa.z),desPosa);
	
	desPosa.y = transform.position.y; desPosb.y = transform.position.y; desPosa = desPosb;
	desPosb.x -= Width();
	Gizmos.DrawLine(desPosa,desPosb); desPosa.y += gridHeight; desPosb.y += gridHeight; Gizmos.DrawLine(desPosa,desPosb);
	Gizmos.DrawLine(new Vector3(desPosa.x,desPosa.y - gridHeight,desPosa.z),desPosa);
	
	desPosa.y = transform.position.y; desPosb.y = transform.position.y; desPosa = desPosb;
	desPosb.z -= Height();
	Gizmos.DrawLine(desPosa,desPosb); desPosa.y += gridHeight; desPosb.y += gridHeight; Gizmos.DrawLine(desPosa,desPosb);
	Gizmos.DrawLine(new Vector3(desPosa.x,desPosa.y - gridHeight,desPosa.z),desPosa);
	
	//Show Grid Lines
	if(showGrid){
		transform.rotation = Quaternion.identity; //Reset Rotation
		DebugDraw(transform.position,gridSizeZ,gridSizeX,gridSpacing,Color.white);
	}
}

private function DebugDraw(origin : Vector3, numRows : int, numCols : int, cellSize : float,color : Color) {		
	var width : float = ( numCols * cellSize );
	var height : float = ( numRows * cellSize );
	//AXIS Points
	var kXAxis = Vector3.right; 
	var kZAxis = Vector3.forward;
	// Draw the horizontal grid lines
	for (var i : int = 0; i < numRows + 1; i++){
		var startPos : Vector3 = origin + i * cellSize * kZAxis;
		var endPos : Vector3 = startPos + width * kXAxis;
		Debug.DrawLine(startPos, endPos, color);
	}
	// Draw the vertial grid lines
	for (var a : int = 0; a < numCols + 1; a++){
		var startPosB : Vector3 = origin + a * cellSize * kXAxis;
		var endPosB : Vector3 = startPosB + height * kZAxis;
		Debug.DrawLine(startPosB, endPosB, color);
	}
}

@script AddComponentMenu ("ViralVector/PathFinding/GridGraph")