"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
class ListGraph {
    constructor() {
        this.vertices = new Map(); // 存放所有的顶点
        this.edges = new Set(); // 存放所有顶点的所有边
    }
    /**
     * 查看输出
     */
    print() {
        console.log('\n');
        console.log(`【顶点数量】 =>  【${this.verticesSize()}】`);
        this.vertices.forEach((e, index, self) => {
            console.log(`【顶点】 =>  ${e.value}`);
        });
        console.log(`【边数量】 =>  【${this.edgesSize()}】`);
        for (let edge of this.edges) { // 遍历Set
            console.log(`【边】 => ${edge.toString()}`);
        }
    }
    /**
     * 边的数量
     */
    edgesSize() {
        return this.edges.size;
    }
    /**
     * 顶点数量
     */
    verticesSize() {
        return this.vertices.size;
    }
    /**
     * 添加顶点，如果已存在，则忽略
     * @param v
     */
    addVertex(v) {
        if (this.vertices.has(v))
            return;
        this.vertices.set(v, new Vertex(v));
    }
    /**
     *
     * 添加边，如果存在旧的边，需要先移除
     *
     * @param from
     * @param to
     * @param weight
     */
    addEdge(from, to, weight) {
        // 判断from、to顶点是否存在
        let fromVertex = this.vertices.get(from);
        if (!fromVertex) {
            fromVertex = new Vertex(from);
            this.vertices.set(from, fromVertex);
        }
        let toVertex = this.vertices.get(to);
        if (!toVertex) {
            toVertex = new Vertex(to);
            this.vertices.set(to, toVertex);
        }
        // 创建要添加的边
        const edge = new Edge(fromVertex, toVertex);
        edge.weight = weight;
        // 如果存在旧的边，则先移除,
        // 相同的边的条件是 （起点、终点的值一样）， 因为无法自定义 哈希函数，所以只能通过自定义的 equals 函数来比对
        let oldEdge;
        for (let element of fromVertex.outEdges) { // 遍历Set
            if (element.equals(edge)) {
                oldEdge = element;
            }
        }
        if (oldEdge) {
            fromVertex.outEdges.delete(oldEdge);
            toVertex.inEdges.delete(oldEdge);
            this.edges.delete(oldEdge);
        }
        // 添加新的边
        fromVertex.outEdges.add(edge);
        toVertex.inEdges.add(edge);
        this.edges.add(edge);
    }
    /**
     * 移除顶点，需要同时移除顶点的 inEdges、outEdges、全局edges中的相关edge
     * @param v
     */
    removeVertex(v) {
        const vertex = this.vertices.get(v);
        if (!vertex)
            return;
        this.vertices.delete(v);
        var inEdgesIter = vertex.inEdges[Symbol.iterator]();
        let inEdge = inEdgesIter.next().value;
        do {
            if (inEdge) {
                inEdge.to.inEdges.delete(inEdge);
                // 将当前遍历到的元素edge从集合vertex.outEdges中删掉
                this.edges.delete(inEdge);
            }
            inEdge = inEdgesIter.next().value;
        } while (inEdge);
        var outEdgesIter = vertex.outEdges[Symbol.iterator]();
        let outEdge = outEdgesIter.next().value;
        do {
            if (outEdge) {
                outEdge.to.inEdges.delete(outEdge);
                // 将当前遍历到的元素edge从集合vertex.outEdges中删掉
                this.edges.delete(outEdge);
            }
            outEdge = outEdgesIter.next().value;
        } while (outEdge);
    }
    /**
     * 移除边
     * @param from
     * @param to
     */
    removeEdge(from, to) {
        const fromVertex = this.vertices.get(from);
        if (!fromVertex)
            return;
        const toVertex = this.vertices.get(to);
        if (!toVertex)
            return;
        // 创建要删除的边
        const edge = new Edge(fromVertex, toVertex);
        // 如果存在，则移除,
        // 相同的边的条件是 （起点、终点的值一样）， 因为无法自定义 哈希函数，所以只能通过自定义的 equals 函数来比对
        let oldEdge;
        for (let element of fromVertex.outEdges) { // 遍历Set
            if (element.equals(edge)) {
                oldEdge = element;
            }
        }
        if (oldEdge) {
            fromVertex.outEdges.delete(oldEdge);
            toVertex.inEdges.delete(oldEdge);
            this.edges.delete(oldEdge);
        }
    }
}
exports.ListGraph = ListGraph;
/**
 * 顶点类
 */
class Vertex {
    constructor(value) {
        this.value = value;
        this.inEdges = new Set();
        this.outEdges = new Set();
    }
    equals(vertex) {
        return _.isEqual(this.value, vertex.value);
    }
    toString() {
        return this.value === undefined ? "undefined" : this.value;
    }
}
/**
 * 边类
 */
class Edge {
    constructor(from, to, weight) {
        this.from = from;
        this.to = to;
        this.weight = weight;
    }
    equals(edge) {
        // 判断连个节点是否相等
        const customizer = (v1, v2) => {
            return v1.equals(v2);
        };
        // 如果边的起点、终点，内容相等，就是同一条边，权重weight不考虑
        return _.isEqualWith(this.from, edge.from, customizer) && _.isEqualWith(this.to, edge.to, customizer);
    }
    toString() {
        return "Edge [from=" + this.from.toString() + ", to=" + this.to.toString() + ", weight=" + this.weight + "]";
    }
}