import { Component, OnInit } from '@angular/core';

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
  ttl_urls= [
    "http://localhost:4200/assets/ttl/people/",
    "http://localhost:4200/assets/ttl/data_catalog/"
  ];

  ttls = [["llama.ttl", "marilena.ttl", "marta.ttl", "people.ttl", "relationship.ttl", "robert.ttl", "maya.ttl", "sample.ttl"],
    [
    "data_set/chronos_data_lake.ttl",

    "data_set/fls/fls_schema_v0.ttl",
    "data_set/fls/fls_thor.ttl",
    "data_set/fls/fls_thor_s3_distribution.ttl",

    "data_set/fls_sharp/fls_sharp.ttl",
    "data_set/fls_sharp/fls_sharp_s3_distribution.ttl",
    "data_set/fls_sharp/fls_sharp_schema_v0.ttl",

    "data_set/gtas/gtas.ttl",
    "data_set/gtas/gtas_es_distributions.ttl",
    "data_set/gtas/lqd_schema_v0.ttl",
    "data_set/gtas/mlt_schema_v0.ttl",
    "data_set/gtas/selt_schema_v0.ttl",
    "data_set/gtas/testDetails.ttl",
    "data_set/gtas/testSummary.ttl",

    "data_set/hlog/hlog.ttl",
    "data_set/hlog/hlog_s3_distribution.ttl",
    "data_set/hlog/hlog_schema_v0.ttl",

    "data_set/nac/nac_ports.ttl",
    "data_set/nac/nac_ports_s3_distribution.ttl",
    "data_set/nac/nac_ports_schema_v0.ttl",
    "data_set/nac/nac_ports_schema_v1.ttl",

    "data_set/sdc/sdc.ttl",
    "data_set/sdc/sdcEsCache_distribution.ttl",
    "data_set/sdc/sdcS3_distribution.ttl",
    "data_set/sdc/sdc_schema_v0.ttl",

    "data_set/services/athena_proxy_service.ttl",
    "data_set/services/es_proxy_service.ttl",

    // "dq/HLOGs3_correctness_dq_queries.ttl",
    // "dq/NAC_correctness_DQ_Queries.ttl",
    // "dq/NACs3_completeness_dq_queries.ttl",
    // "dq/SDCs3_completeness_dq_queries.ttl",
    // "dq/sdcS3_correctness_dq_queries.ttl",
    // "dq/sdcS3_distribution_dq.ttl",

    "services/athena_proxy_service.ttl",
    "services/es_proxy_service.ttl"
  ]
  ];

  starting_points=["http://example/knowledge-base/marilena","http://chronos/data-lake/chronosDataLake"];

  predicate_sort_order = [
    //people
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",

    "http://xmlns.com/foaf/spec/firstName",
    "http://xmlns.com/foaf/spec/lastName",
    "http://xmlns.com/foaf/spec/nick",
    "http://xmlns.com/foaf/spec/gender",
    "http://xmlns.com/foaf/spec/age",
    "http://xmlns.com/foaf/spec/mbox",
    "http://xmlns.com/foaf/spec/myersBriggs",
    "http://xmlns.com/foaf/spec/topic_interest",

    "http://www.perceive.net/schemas/20021119/relationship/spouseOf",
    "http://www.perceive.net/schemas/20021119/relationship/parentOf",
    "http://www.perceive.net/schemas/20021119/relationship/childOf",
    "http://www.perceive.net/schemas/20021119/relationship/siblingOf",

    "http://www.perceive.net/schemas/20021119/relationship/friendOf",

    "http://example/rdf-schema#hasPet",

    // catalog
    "http://www.w3.org/2000/01/rdf-schema#label",
    "http://www.w3.org/2000/01/rdf-schema#comment",
    "http://chronos/rdf-schema#unitOfMeasure",
    "http://chronos/rdf-schema#hasFormat",
    "http://chronos/rdf-schema#glueTable",

    "http://chronos/rdf-schema#hasDataSet",
    "http://chronos/rdf-schema#hasServices",
    "http://chronos/rdf-schema#hasDistribution",
    "http://chronos/rdf-schema#conformsToSchema",

    "http://chronos/rdf-schema#exposedWith",

    "http://chronos/rdf-schema#hasAttribute"
  ];

  current_node = null;
  triples = [];
  combined_triples = [];
  incoming_triples = [];
  own_triples = [];
  outgoing_triples = [];

  constructor() {

  }

  load_ttl(setNdx){
    this.store = $rdf.graph();
    this.fetcher = new $rdf.Fetcher(this.store, 5000);

    console.log("Loading turtles");
    this.ttls[setNdx].forEach((ttl)=>{
      console.log(ttl);
      this.fetcher.nowOrWhenFetched(this.ttl_urls[setNdx] + ttl, function(isOk, body, xhr) {
        if (!isOk) {
          alert("Oops, something happened and couldn't fetch data");
        }
      });
    });

    setTimeout(()=>{
      this.onNodeClick(this.store.sym(this.starting_points[setNdx]));
    }, 500);
  }

  ngOnInit(): void {
    this.load_ttl(0);
  }


  showAllTriples() {
    this.triples = this.store.match();
  }

    // termType == "NameNode", "Literal", "BlankNode"

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

  filterTripleWithLiteralObject = (triple) => triple.object && triple.object.termType === "Literal";
  filterNavigableNodes = (triple) => triple.object &&  (triple.object.termType === "NamedNode" || triple.object.termType === "BlankNode");

  reducerGroupByPredicate = (accumulator, currentTriple, currentIndex, array) => {
    let existingPredicateNdx = accumulator.findIndex((triple)=>triple.predicate.value==currentTriple.predicate.value);
    if (existingPredicateNdx >= 0){
      accumulator[existingPredicateNdx].object += (", "+ currentTriple.object);
    }else{
      accumulator.push(currentTriple);
    }
    return accumulator;
  };
  reducerGroupByPredicateForLinkableObjects = (accumulator, currentTriple, currentIndex, array) => {
    let existingPredicateNdx = accumulator.findIndex((triple)=>triple.predicate.value==currentTriple.predicate.value);
    if (existingPredicateNdx >= 0){
      if (!accumulator[existingPredicateNdx].objects){
        accumulator[existingPredicateNdx].objects = [accumulator[existingPredicateNdx].object];
        accumulator[existingPredicateNdx].object = null;
      }
      accumulator[existingPredicateNdx].objects.push(currentTriple.object);
    }else{
      accumulator.push(currentTriple);
    }
    return accumulator;
  };

  sortByPredicateImportance = (a,b)=> this.predicate_sort_order.indexOf(a.predicate.value) - this.predicate_sort_order.indexOf(b.predicate.value);


  onNodeClick(node){
    this.triples=[];
    this.current_node = node;
    let outgoing_and_owned_triples=this.store.match(node, undefined, undefined);

    this.own_triples = outgoing_and_owned_triples
      .filter(this.filterTripleWithLiteralObject)
      .reduce(this.reducerGroupByPredicate, [])
      .sort(this.sortByPredicateImportance)
    ;
    this.outgoing_triples = outgoing_and_owned_triples
      .filter(this.filterNavigableNodes)
      .reduce(this.reducerGroupByPredicateForLinkableObjects, [])
      .sort(this.sortByPredicateImportance)

    this.incoming_triples = this.store.match(undefined, undefined, node)
      .sort(this.sortByPredicateImportance);

  }

   getShortValue(node){
      if (!node || !node.value) {
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


}
