import { Component, OnInit } from '@angular/core';
import {type} from "os";

declare var $rdf: any;
declare var d3: any;

@Component({
  selector: 'app-component1',
  templateUrl: './component1.component.html',
  styleUrls: ['./component1.component.css']
})
export class Component1Component implements OnInit {

  store = $rdf.graph();
  fetcher = new $rdf.Fetcher(this.store, 5000);
  ttl_url = "http://localhost:4200/assets/ttl/people/";
  ttls = ["llama.ttl", "marilena.ttl", "marta.ttl", "people.ttl", "relationship.ttl", "robert.ttl", "maya.ttl", "sample.ttl"];

  svg = null;
  force = null;
  graph = null;

  current_node = null;
  triples = [];
  combined_triples = [];
  incoming_triples = [];
  own_triples = [];
  outgoing_triples = [];

  constructor() {

  }

  ngOnInit(): void {
    console.log("Loading turtles");
    this.ttls.forEach((ttl)=>{
      console.log(ttl);
      this.fetcher.nowOrWhenFetched(this.ttl_url + ttl, function(isOk, body, xhr) {
        if (!isOk) {
          alert("Oops, something happened and couldn't fetch data");
        }
      });
    });

    this.svg = d3.select("#svg-body").append("svg")
      .attr("width", 800)
      .attr("height", 600)
    ;

    setTimeout(()=>{
      this.onNodeClick(this.store.sym("http://example/knowledge-base/marilena"));
    }, 500);
  }


  showAllTriples() {
    this.triples = this.store.match();

    this.force = d3.layout.force().size([800, 600]);

    this.graph = this.triplesToGraph(this.triples.map((triple)=> {
      return {
        subject: this.getShortValue(triple.subject),
        predicate: this.getShortValue(triple.predicate),
        object: this.getShortValue(triple.object)
      }
    }));

    this.update();

  }

    // termType == "NameNode"
    // termType == "Literal"
    // termType == "BlankNode"


  addTriplesIntoNet(combined_triples, triples_to_add) {
    triples_to_add.forEach((triple)=>{
      let existing_triple_for_same_subj_obj = combined_triples.find(existing_triple=>
        triple.subject.value == existing_triple.subject.value &&
        triple.object.value == existing_triple.object.value
      );
      if (existing_triple_for_same_subj_obj){
        existing_triple_for_same_subj_obj.links.push({predicate:triple.predicate, direction:"in"});
      }
      let existing_reverse_triple_for_same_subj_obj = combined_triples.find(existing_triple=>
        triple.object.value == existing_triple.subject.value &&
        triple.subject.value == existing_triple.object.value
      );
      if (existing_reverse_triple_for_same_subj_obj){
        existing_reverse_triple_for_same_subj_obj.links.push({predicate:triple.predicate, direction:"out"});
      }
      if (!existing_triple_for_same_subj_obj && !existing_reverse_triple_for_same_subj_obj){
        combined_triples.push({subject:triple.subject, links:[{predicate:triple.predicate, direction:"in"}], object:triple.object});
      }
    });
    return combined_triples;
  }

  onNodeClick(node){
    this.triples=[];
    this.current_node = node;
    this.incoming_triples = this.store.match(undefined, undefined, node);

    this.outgoing_triples = this.store.match(node, undefined, undefined)
      .filter((triple)=>{
        return triple.object.termType === "NamedNode" || triple.object.termType === "BlankNode"
    });

    this.own_triples = this.store.match(node, undefined, undefined)
      .filter((triple)=>{
        return triple.object.termType === "Literal"
    });

    this.combined_triples = [];
    this.combined_triples = this.addTriplesIntoNet(this.combined_triples, this.outgoing_triples);
    this.combined_triples = this.addTriplesIntoNet(this.combined_triples, this.incoming_triples);


    // ---

    this.force = d3.layout.force().size([800, 600]);

    this.graph = this.triplesToGraph(this.incoming_triples.concat(this.outgoing_triples).map((triple)=> {
      return {
        subject: this.getShortValue(triple.subject),
        predicate: this.getShortValue(triple.predicate),
        object: this.getShortValue(triple.object)
      }
    }));

    this.update();

  }

   getShortValue(node){
      if (!node) {
        return "";
      }
      return node.value.split(/\/|#/).pop().replace( /([A-Z])/g, " $1" ).toLowerCase();
   }

  replaceDirectionWithArrow(direction){
    switch(direction){
      case "in": return "->";
      case "out": return "<-";
      case "both": return "<->";
    }
  }

  getShortValuesAndDirection(links){
    return links.map((link)=>this.getShortValue(link.predicate) + " " + this.replaceDirectionWithArrow(link.direction)).join(", ");
  }

  getTypeOrEmptyString(node){
    if (!node){
      return ""
    }
    let typeNodes = this.store.match(node, this.store.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), undefined);
    return typeNodes.map(node=>this.getShortValue(node.object)).join(", ");

  }



  // --------------------------------------------
  // --------------------------------------------
  // --------------------------------------------
  filterNodesById(nodes,id){
    return nodes.filter(function(n) { return n.id === id; });
  }

  filterNodesByType(nodes,value){
    return nodes.filter(function(n) { return n.type === value; });
  }

  triplesToGraph(triples){

    this.svg.html("");
    //Graph
    this.graph={nodes:[], links:[], triples:[]};

    //Initial Graph from triples
    triples.forEach((triple)=>{
      var subjId = triple.subject;
      var predId = triple.predicate;
      var objId = triple.object;

      var subjNode = this.filterNodesById(this.graph.nodes, subjId)[0];
      var objNode  = this.filterNodesById(this.graph.nodes, objId)[0];

      if(subjNode==null){
        subjNode = {id:subjId, label:subjId, weight:1, type:"node"};
        this.graph.nodes.push(subjNode);
      }

      if(objNode==null){
        objNode = {id:objId, label:objId, weight:1, type:"node"};
        this.graph.nodes.push(objNode);
      }

      var predNode = {id:predId, label:predId, weight:1, type:"pred"} ;
      this.graph.nodes.push(predNode);

      var blankLabel = "";

      this.graph.links.push({source:subjNode, target:predNode, predicate:blankLabel, weight:1});
      this.graph.links.push({source:predNode, target:objNode, predicate:blankLabel, weight:1});

      this.graph.triples.push({s:subjNode, p:predNode, o:objNode});

    });

    return this.graph;
  }

  //  addNewTriple(){
  //   var subj = $("#subject").val();
  //   var pred = $("#predicate").val();
  //   var obj  = $("#object").val();
  //
  //   triples.push({ subject:subj , 	predicate:pred , 	object:obj });
  //   graph = triplesToGraph(triples);
  //   update();
  // }


  update(){
    // ==================== Add Marker ====================
    this.svg.append("svg:defs").selectAll("marker")
      .data(["end"])
      .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:polyline")
      .attr("points", "0,-5 10,0 0,5")
    ;

    // ==================== Add Links ====================
    var links = this.svg.selectAll(".link")
      .data(this.graph.triples)
      .enter()
      .append("path")
      .attr("marker-end", "url(#end)")
      .attr("class", "link")
    ;

    // ==================== Add Link Names =====================
    var linkTexts = this.svg.selectAll(".link-text")
      .data(this.graph.triples)
      .enter()
      .append("text")
      .attr("class", "link-text")
      .text( function (d) { return d.p.label; })
    ;

    // linkTexts.append("title")
    // 		.text(function(d) { return d.predicate; });

    // ==================== Add Node Names =====================
    var nodeTexts = this.svg.selectAll(".node-text")
      .data(this.filterNodesByType(this.graph.nodes, "node"))
      .enter()
      .append("text")
      .attr("class", "node-text")
      .text( function (d) { return d.label; })
    ;

    //nodeTexts.append("title")
    //		.text(function(d) { return d.label; });

    // ==================== Add Node =====================
    var nodes = this.svg.selectAll(".node")
      .data(this.filterNodesByType(this.graph.nodes, "node"))
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 8)
      .call(this.force.drag)
    ;//nodes

    // ==================== Force ====================
    this.force.on("tick", function() {
      nodes
        .attr("cx", function(d){ return d.x; })
        .attr("cy", function(d){ return d.y; })
      ;

      links
        .attr("d", function(d) {
          return "M" 	+ d.s.x + "," + d.s.y
            + "S" + d.p.x + "," + d.p.y
            + " " + d.o.x + "," + d.o.y;
        })
      ;

      nodeTexts
        .attr("x", function(d) { return d.x + 12 ; })
        .attr("y", function(d) { return d.y + 3; })
      ;


      linkTexts
        .attr("x", function(d) { return 4 + (d.s.x + d.p.x + d.o.x)/3  ; })
        .attr("y", function(d) { return 4 + (d.s.y + d.p.y + d.o.y)/3 ; })
      ;
    });

    // ==================== Run ====================
    this.force
      .nodes(this.graph.nodes)
      .links(this.graph.links)
      .charge(-500)
      .linkDistance(50)
      .start()
    ;
  }


}
