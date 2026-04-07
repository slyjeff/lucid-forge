export namespace agents {
	
	export class Agent {
	    name: string;
	    description: string;
	    model: string;
	    lucidforge: boolean;
	    identity: string;
	    directories: string[];
	    docs: string[];
	    instructions: string;
	    learnings: string;
	    filename: string;
	
	    static createFrom(source: any = {}) {
	        return new Agent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.model = source["model"];
	        this.lucidforge = source["lucidforge"];
	        this.identity = source["identity"];
	        this.directories = source["directories"];
	        this.docs = source["docs"];
	        this.instructions = source["instructions"];
	        this.learnings = source["learnings"];
	        this.filename = source["filename"];
	    }
	}

}

export namespace artifacts {
	
	export class Connection {
	    from: string;
	    to: string;
	    relationship: string;
	
	    static createFrom(source: any = {}) {
	        return new Connection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.from = source["from"];
	        this.to = source["to"];
	        this.relationship = source["relationship"];
	    }
	}
	export class Member {
	    name: string;
	    kind: string;
	
	    static createFrom(source: any = {}) {
	        return new Member(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.kind = source["kind"];
	    }
	}
	export class ChangeMapFile {
	    path: string;
	    category: string;
	    reasoning: string;
	    members: Member[];
	
	    static createFrom(source: any = {}) {
	        return new ChangeMapFile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.category = source["category"];
	        this.reasoning = source["reasoning"];
	        this.members = this.convertValues(source["members"], Member);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ChangeMap {
	    files: ChangeMapFile[];
	    connections: Connection[];
	
	    static createFrom(source: any = {}) {
	        return new ChangeMap(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.files = this.convertValues(source["files"], ChangeMapFile);
	        this.connections = this.convertValues(source["connections"], Connection);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class PhaseUsage {
	    inputTokens: number;
	    outputTokens: number;
	    costUsd: number;
	
	    static createFrom(source: any = {}) {
	        return new PhaseUsage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.inputTokens = source["inputTokens"];
	        this.outputTokens = source["outputTokens"];
	        this.costUsd = source["costUsd"];
	    }
	}
	export class FeatureUsage {
	    discovery: PhaseUsage;
	    planning: PhaseUsage;
	    execution: PhaseUsage;
	    review: PhaseUsage;
	    totalCostUsd: number;
	
	    static createFrom(source: any = {}) {
	        return new FeatureUsage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.discovery = this.convertValues(source["discovery"], PhaseUsage);
	        this.planning = this.convertValues(source["planning"], PhaseUsage);
	        this.execution = this.convertValues(source["execution"], PhaseUsage);
	        this.review = this.convertValues(source["review"], PhaseUsage);
	        this.totalCostUsd = source["totalCostUsd"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Feature {
	    schemaVersion: number;
	    id: string;
	    name: string;
	    description: string;
	    status: string;
	    sourceBranch: string;
	    workingBranch: string;
	    baseCommit: string;
	    // Go type: time
	    createdAt: any;
	    hasUxDesign: boolean;
	    stepCount: number;
	    usage: FeatureUsage;
	
	    static createFrom(source: any = {}) {
	        return new Feature(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schemaVersion = source["schemaVersion"];
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.status = source["status"];
	        this.sourceBranch = source["sourceBranch"];
	        this.workingBranch = source["workingBranch"];
	        this.baseCommit = source["baseCommit"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.hasUxDesign = source["hasUxDesign"];
	        this.stepCount = source["stepCount"];
	        this.usage = this.convertValues(source["usage"], FeatureUsage);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Issue {
	    severity: string;
	    step: number;
	    agent: string;
	    file: string;
	    description: string;
	    fixed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Issue(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.severity = source["severity"];
	        this.step = source["step"];
	        this.agent = source["agent"];
	        this.file = source["file"];
	        this.description = source["description"];
	        this.fixed = source["fixed"];
	    }
	}
	
	export class Pattern {
	    name: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new Pattern(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	    }
	}
	
	export class StepUsage {
	    inputTokens: number;
	    outputTokens: number;
	    costUsd: number;
	
	    static createFrom(source: any = {}) {
	        return new StepUsage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.inputTokens = source["inputTokens"];
	        this.outputTokens = source["outputTokens"];
	        this.costUsd = source["costUsd"];
	    }
	}
	export class Review {
	    issues: Issue[];
	    usage: StepUsage;
	
	    static createFrom(source: any = {}) {
	        return new Review(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.issues = this.convertValues(source["issues"], Issue);
	        this.usage = this.convertValues(source["usage"], StepUsage);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Validation {
	    passed: boolean;
	    retries: number;
	
	    static createFrom(source: any = {}) {
	        return new Validation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.passed = source["passed"];
	        this.retries = source["retries"];
	    }
	}
	export class Task {
	    description: string;
	    completed: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.description = source["description"];
	        this.completed = source["completed"];
	    }
	}
	export class Step {
	    order: number;
	    agent: string;
	    title: string;
	    status: string;
	    tasks: Task[];
	    validation: Validation;
	    changeMap: ChangeMap;
	    patterns: Pattern[];
	    changeSummary: string;
	    usage: StepUsage;
	    viewedFiles: string[];
	
	    static createFrom(source: any = {}) {
	        return new Step(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.order = source["order"];
	        this.agent = source["agent"];
	        this.title = source["title"];
	        this.status = source["status"];
	        this.tasks = this.convertValues(source["tasks"], Task);
	        this.validation = this.convertValues(source["validation"], Validation);
	        this.changeMap = this.convertValues(source["changeMap"], ChangeMap);
	        this.patterns = this.convertValues(source["patterns"], Pattern);
	        this.changeSummary = source["changeSummary"];
	        this.usage = this.convertValues(source["usage"], StepUsage);
	        this.viewedFiles = source["viewedFiles"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	

}

export namespace git {
	
	export class FileDiff {
	    path: string;
	    oldContent: string;
	    newContent: string;
	    isNew: boolean;
	    isDeleted: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileDiff(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.oldContent = source["oldContent"];
	        this.newContent = source["newContent"];
	        this.isNew = source["isNew"];
	        this.isDeleted = source["isDeleted"];
	    }
	}

}

