#pragma strict

class PathReceiver extends MonoBehaviour{ //Simple Class To Receieve Paths

	protected var currentPath : List.<Vector3>;
	
	function RecievePath(path : List.<Vector3>){
		currentPath = path;
	}
}
@script AddComponentMenu ("FPX/PathFinding/PathReceiver")