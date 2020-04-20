import { Component, OnInit } from '@angular/core';

declare var $rdf: any;

@Component({
  selector: 'app-component1',
  templateUrl: './component1.component.html',
  styleUrls: ['./component1.component.css']
})
export class Component1Component implements OnInit {

  store = $rdf.graph();
  fetcher = new $rdf.Fetcher(this.store, 5000);
  ttl_url = "http://localhost:4200/assets/ttl/";
  ttls = ["llama.ttl", "marilena.ttl", "marta.ttl", "people.ttl", "relationship.ttl", "robert.ttl", "maya.ttl", "sample.ttl"];

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
  }

  showAllTriples() {
    this.triples = this.store.match();
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


  }
   getShortValue(node){
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
}
