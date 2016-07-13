# unity3d-pathfinding
A* priority-queue request queued path-finding in unity script

###### Details
* A* implementation in UnityScript 
* Utilizes a Heap (prioity queue) for performance 
* Queued path requests -> agents call for path & recieve a response once ready
* Heuristics 
* Simple Smoothing 
* Path & grid visualizations
* Effiecient pathing with max agent stress test (can handle pth request for large #AI)

###### Set Up
1. Attach PathFinder.js & GridGraph to empty gameobject(s)
2. Set properties on PathFinder 
    * props collision, enemies layers = obstacles to avoid
3. Attach AiPathAgent.js & SimpleAiController.js to path recievers....SimpleAiController extends PathReciver.js 
    * Set target...PathReciver.js can be extnded to a class where target is auto found ..etc 

###### Extras
* FunnelSmoth has not been implmented.