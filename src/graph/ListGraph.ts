import * as _ from 'lodash'
import { Graph, VertexVisitor, EdgeInfo, PathInfo, WeightManager } from './Graph';
import { Comparator } from '../base';
import { MinHeap } from '../base/heap/MinHeap';

import { GenericUnionFind } from '../union/GenericUnionFind';

export class ListGraph<V, E> extends Graph<V, E> {
  private vertices: Map<V, Vertex<V, E>> = new Map(); // 存放所有的顶点
  private edges: Set<Edge<V, E>> = new Set(); // 存放所有顶点的所有边
  private edgeComparator: Comparator<Edge<V, E>> = new Comparator(
    (e1: Edge<V, E>, e2: Edge<V, E>) => {
      if (e1.weight !== undefined && e2.weight !== undefined) {
        return this.weightManager.compare(e1.weight, e2.weight);
      } else {
        return 0;
      }
    }
  );

  constructor(weightManager: WeightManager<E>) {
    super(weightManager);
  }
  /**
   * 查看输出
   */
  print(): void {
    console.log('\n');
    console.log(`【顶点数量】 =>  【${this.verticesSize()}】`);
    this.vertices.forEach((e: Vertex<V, E>, index: V, self) => {
      console.log(`【顶点】 =>  ${e.value}`);
    })
    console.log(`【边数量】 =>  【${this.edgesSize()}】`);
    for (let edge of this.edges) { // 遍历Set
      console.log(`【边】 => ${edge.toString()}`);
    }
  }
  /**
   * 边的数量
   */
  edgesSize(): number {
    return this.edges.size;
  }
  /**
   * 顶点数量
   */
  verticesSize(): number {
    return this.vertices.size;
  }

  /**
   * 添加顶点，如果已存在，则忽略
   * @param v 
   */
  addVertex(v: V): void {
    if (this.vertices.has(v)) return;
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
  addEdge(from: V, to: V, weight?: any): void {
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
      fromVertex.outEdges.delete(oldEdge)
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
  removeVertex(v: V): void {
    const vertex = this.vertices.get(v);
    if (!vertex) return;

    this.vertices.delete(v);

    var inEdgesIter = vertex.inEdges[Symbol.iterator]();
    let inEdge: Edge<V, E> = inEdgesIter.next().value;
    do {
      if (inEdge) {
        inEdge.to.inEdges.delete(inEdge);
        // 将当前遍历到的元素edge从集合vertex.outEdges中删掉
        this.edges.delete(inEdge);
      }
      inEdge = inEdgesIter.next().value;
    } while (inEdge);


    var outEdgesIter = vertex.outEdges[Symbol.iterator]();
    let outEdge: Edge<V, E> = outEdgesIter.next().value;
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
  removeEdge(from: V, to: V): void {
    const fromVertex = this.vertices.get(from);
    if (!fromVertex) return;

    const toVertex = this.vertices.get(to);
    if (!toVertex) return;

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
      fromVertex.outEdges.delete(oldEdge)
      toVertex.inEdges.delete(oldEdge);
      this.edges.delete(oldEdge);
    }
  }

  /**
   * 广度优先遍历
   * @param v 
   */
  bfs(begin: V, visitor: VertexVisitor<V>): void {
    if (!visitor) return;
    const beginVertex = this.vertices.get(begin);
    if (!beginVertex) return;

    // 遍历过的顶点集合
    const visitedSet = new Set<Vertex<V, E>>();
    // 通过队列来实现 广度优先搜索
    const queue: Vertex<V, E>[] = [];
    // 起点入队
    queue.push(beginVertex);
    // 记录遍历过的对象
    visitedSet.add(beginVertex);

    while (queue.length !== 0) {
      let vertex = queue.pop();
      if (vertex === undefined) break;

      if (visitor.visit(vertex.value)) return;

      // 将能直接到达的下一个顶点集合，加入到队列当中，需过滤掉访问过的顶点
      vertex.outEdges.forEach(element => {
        if (!visitedSet.has(element.to)) {
          queue.push(element.to);
          // 记录遍历过的对象
          visitedSet.add(element.to);
        };
      });
    }
  }


  /**
    * 深度优先遍历
    * @param v 
    */
  dfs(begin: V, visitor: VertexVisitor<V>): void {
    if (!visitor) return;
    let vertex = this.vertices.get(begin);
    if (!vertex) return;

    // 访问过的顶点集合
    const visitedSet = new Set<Vertex<V, E>>();

    if (Math.random() > 0.5) {
      // 1. 非递归实现
      console.log('dfs 非递归:');
      this.dfsNormal(vertex, visitedSet, visitor);
    } else {
      // 2. 递归实现
      console.log('\ndfs 递归:');
      visitedSet.clear();
      this.dfsRecursion(vertex, visitedSet, visitor)
    }
  }

  /**
   * 深度优先遍历非递归实现
   */
  private dfsNormal(vertex: Vertex<V, E> | undefined, visitedSet: Set<Vertex<V, E>>, visitor: VertexVisitor<V>) {
    if (!vertex) return;
    // 1. 非递归实现
    const stack: Vertex<V, E>[] = [];

    stack.push(vertex);
    visitedSet.add(vertex);
    if (visitor.visit(vertex.value)) return;

    while (stack.length !== 0) {
      vertex = stack.pop();
      if (!vertex) continue;

      for (const edge of vertex.outEdges) {
        if (visitedSet.has(edge.to)) continue;

        stack.push(edge.from);
        stack.push(edge.to);
        visitedSet.add(edge.to);

        if (visitor.visit(edge.to.value)) return;
        break;
      }
    }
  }
  /**
   * 深度优先遍历递归执行函数
   */
  private dfsRecursion(vertex: Vertex<V, E>, visitedSet: Set<Vertex<V, E>>, visitor: VertexVisitor<V>) {
    if (visitor.visit(vertex.value)) return;

    visitedSet.add(vertex);
    for (const edge of vertex.outEdges) {
      if (!visitedSet.has(edge.to)) {
        this.dfsRecursion(edge.to, visitedSet, visitor);
      }
    }
  }

  /**
   * 拓扑排序
   */
  topologicalSort(): V[] {
    const list = new Array<V>();

    // 入度为0的操作队列，当顶点的入度为0，添加到该队列当中
    const queue = new Array<Vertex<V, E>>();
    // 存储所有节点的入度信息
    const ins = new Map<Vertex<V, E>, number>();

    // 存储所有的顶点的入度数量，并将度为0的节点放进queue
    this.vertices.forEach((vertex: Vertex<V, E>) => {
      if (vertex.inEdges.size === 0) {
        queue.push(vertex);
      } else {
        ins.set(vertex, vertex.inEdges.size);
      }
    });

    // 操作queue中的顶点
    while (queue.length !== 0) {
      const vertex = queue.pop();
      if (!vertex) continue;

      // 入度为0的，放进list
      list.push(vertex.value);

      // 遍历该节点的出度，并将所有边的 to的入度数量减一，假如to的入度为0，则加入到queue
      vertex.outEdges.forEach((edge: Edge<V, E>) => {
        if (edge) {
          let value: number = (ins.get(edge.to) || 0) - 1;
          if (value === 0) {
            queue.push(edge.to);
          } else {
            ins.set(edge.to, value);
          }
        }
      })
    }
    return list;
  }

  /**
   *  最小生成树，prim、krushal
   */
  mst(): Set<EdgeInfo<V, E>> {
    // return this.prim();
    // return this.kruskal();
    return Math.random() > 0.5 ? this.prim() : this.kruskal();
  }
  prim(): Set<EdgeInfo<V, E>> {
    console.log('prim: ');
    const edgeInfos = new Set<EdgeInfo<V, E>>();

    // 遍历所有的顶点
    const it = this.vertices.values()[Symbol.iterator]();
    let vertex: Vertex<V, E> = it.next().value;
    if (vertex === undefined) return edgeInfos;

    // 存储已经遍历过的顶点
    const addedVertices = new Set<Vertex<V, E>>();
    // 记录第一个顶点
    addedVertices.add(vertex);

    // 初始化最小堆，用于记录当前顶点，所有的出度，取出最小的出度
    const heap: MinHeap<Edge<V, E>> = new MinHeap([...vertex.outEdges], this.edgeComparator);
    const verticesSize = this.vertices.size; // 顶点数量

    while (!heap.isEmpty() && addedVertices.size < verticesSize) { // 堆还有数据，并且没有遍历完所有的顶点
      const edge: Edge<V, E> = heap.remove(); // 拿到最小权重的边 edge
      if (addedVertices.has(edge.to)) continue; // 过滤已经添加的顶点

      edgeInfos.add(edge.info());
      addedVertices.add(edge.to);
      // 并最短路径的目标顶点 to 的所有出度 outEdges，加入到最小堆，保证下次从堆中 remove 出来的是最小权重的edge
      for (const nextEdge of edge.to.outEdges) {// heap.addAll(edge.to.outEdges); 
        if (!addedVertices.has(nextEdge.to)) {
          heap.add(nextEdge);
        }
      }

    }
    return edgeInfos;
  }
  kruskal(): Set<EdgeInfo<V, E>> {
    console.log('kruskal: ');
    const edgeInfos = new Set<EdgeInfo<V, E>>();

    const edgeSize = this.vertices.size - 1;
    if (edgeSize == -1) return edgeInfos;

    const heap: MinHeap<Edge<V, E>> = new MinHeap([...this.edges], this.edgeComparator);
    const uf: GenericUnionFind<Vertex<V, E>> = new GenericUnionFind();
    this.vertices.forEach((vertex: Vertex<V, E>, v: V) => {
      uf.makeSet(vertex);
    });

    while (!heap.isEmpty() && edgeInfos.size < edgeSize) {
      const edge: Edge<V, E> = heap.remove();
      if (uf.isSame(edge.from, edge.to)) continue; // 并查集：如果已经有一个共同顶点的话，说明合并以后，会产生环，所以要过滤掉
      edgeInfos.add(edge.info());
      uf.union(edge.from, edge.to);
    }
    return edgeInfos;
  }


  /**
   * Floyd 多源最短路径算法
   */
  public shortestPaths(): Map<V, Map<V, PathInfo<V, E>>> {// 多源最短路径
    const paths: Map<V, Map<V, PathInfo<V, E>>> = new Map();
    // 初始化
    for (let edge of this.edges) {
      let map = paths.get(edge.from.value);
      if (map === undefined) {
        map = new Map();
        paths.set(edge.from.value, map);
      }

      let pathInfo: PathInfo<V, E> | undefined = new PathInfo(edge.weight);
      pathInfo.edgeInfos.add(edge.info());
      map.set(edge.to.value, pathInfo);
    }

    this.vertices.forEach((vertex2: Vertex<V, E>, v2: V) => {
      this.vertices.forEach((vertex1: Vertex<V, E>, v1: V) => {
        this.vertices.forEach((vertex3: Vertex<V, E>, v3: V) => {
          if (_.isEqual(v1, v2) || _.isEqual(v2, v3) || _.isEqual(v1, v3)) return;

          // v1 -> v2
          const path12 = this.getPathInfo(v1, v2, paths);
          if (path12 === undefined) return;
          // v2 -> v3
          const path23 = this.getPathInfo(v2, v3, paths);
          if (path23 === undefined) return;
          // v1->v3
          let path13 = this.getPathInfo(v1, v3, paths);

          const newWeight = this.weightManager.add(path12.weight!, path23.weight!);
          if (path13 !== undefined && this.weightManager.compare(newWeight, path13.weight!) >= 0) return;

          if (path13 === undefined) {
            path13 = new PathInfo();
            paths.get(v1)?.set(v3, path13);
          } else {
            path13.edgeInfos.clear();
          }

          path13.weight = newWeight;
          for (let i = 0; i < path12.edgeInfos.length(); i++) {
            const edgeInfo: EdgeInfo<V, E> = path12.edgeInfos.get(i);
            path13.edgeInfos.add(edgeInfo);
          }
          for (let i = 0; i < path23.edgeInfos.length(); i++) {
            const edgeInfo: EdgeInfo<V, E> = path23.edgeInfos.get(i);
            path13.edgeInfos.add(edgeInfo);
          }

        });
      });
    });

    return paths;
  }


  private getPathInfo(from: V, to: V, paths: Map<V, Map<V, PathInfo<V, E>>>): PathInfo<V, E> | undefined {
    const map = paths.get(from);
    return map === undefined ? undefined : map.get(to);
  }

  /**
   * 单源最短路径
   * @param begin 起点
   */
  public shortestPath(begin: V): Map<V, PathInfo<V, E>> {
    // return this.dijkstra(begin);
    return this.bellmanFord(begin);
  }

  private bellmanFord(begin: V): Map<V, PathInfo<V, E>> {
    console.log('bellmanFord');
    const beginVertex = this.vertices.get(begin); // 拿到起点
    if (!beginVertex) return new Map();

    const selectedPaths = new Map<V, PathInfo<V, E>>(); // 已经确认最短路径
    selectedPaths.set(beginVertex.value, new PathInfo(this.weightManager.zero()));

    const count = this.vertices.size - 1;
    for (let i = 0; i < count; i++) { // v - 1 次
      for (let edge of this.edges) {
        const fromPath = selectedPaths.get(edge.from.value);
        if (fromPath == null) continue;
        this.relax(edge, fromPath, selectedPaths);
      }
    }
    for (let edge of this.edges) {

      const fromPath = selectedPaths.get(edge.from.value);
      if (fromPath === undefined) continue;
      if (this.relax(edge, fromPath, selectedPaths)) {
        console.log("有负权环");
        return new Map();
      }
    }

    selectedPaths.delete(begin);
    return selectedPaths;
  }

  /**
	 * 松弛
	 * @param edge 需要进行松弛的边
	 * @param fromPath edge的from的最短路径信息
	 * @param paths 存放着其他点（对于dijkstra来说，就是还没有离开桌面的点）的最短路径信息
	 */
  private relax(edge: Edge<V, E>, fromPath: PathInfo<V, E>, paths: Map<V, PathInfo<V, E>>): boolean {
    // 新的可选择的最短路径：beginVertex到edge.from的最短路径 + edge.weight
    const newWeight = this.weightManager.add(fromPath.weight!, edge.weight!);
    // 以前的最短路径：beginVertex到edge.to的最短路径
    let oldPath = paths.get(edge.to.value);
    if (oldPath !== undefined && this.weightManager.compare(newWeight, oldPath.weight!) >= 0) return false;

    if (oldPath == null) {
      oldPath = new PathInfo();
      paths.set(edge.to.value, oldPath);
    } else {
      oldPath.edgeInfos.clear();
    }

    oldPath.weight = newWeight;
    // 将最新的路径保存在 pathInfo的edgeInfos中
    for (let i = 0; i < fromPath.edgeInfos.length(); i++) {
      const edgeInfo: EdgeInfo<V, E> = fromPath.edgeInfos.get(i);
      oldPath.edgeInfos.add(edgeInfo);
    }
    oldPath.edgeInfos.add(edge.info());

    return false;
  }


  private dijkstra(begin: V): Map<V, PathInfo<V, E>> {
    console.log('dijkstra');
    const beginVertex = this.vertices.get(begin); // 拿到起点
    if (!beginVertex) return new Map();

    const paths = new Map<Vertex<V, E>, PathInfo<V, E>>();// begin 到各个点的的最短路径;例如: {'B': 50, 'C': 60};
    const selectedPaths = new Map<V, PathInfo<V, E>>(); // 已经确认最短路径
    paths.set(beginVertex, new PathInfo(this.weightManager.zero()));

    while (paths.size !== 0) {
      let minEntry = this.getMinPath(paths);
      // minVertex离开桌面
      const minVertex = minEntry.value[0];
      const minPathInfo = minEntry.value[1];

      selectedPaths.set(minVertex.value, minPathInfo);
      paths.delete(minVertex);

      // 对它的minVertex的outEdges进行松弛操作
      for (const edge of minVertex.outEdges) {
        // 如果edge.to已经离开桌面，就没必要进行松弛操作
        if (selectedPaths.has(edge.to.value)) continue;
        this.relaxForDijkstra(edge, minPathInfo, paths);
      }
    }

    selectedPaths.delete(begin);

    return selectedPaths;
  }

  relaxForDijkstra(edge: Edge<V, E>, fromPath: PathInfo<V, E>, paths: Map<Vertex<V, E>, PathInfo<V, E>>) {
    // 新的可选择的最短路径：beginVertex到edge.from的最短路径 + edge.weight
    const newWeight = this.weightManager.add(fromPath.weight!, edge.weight!);
    // 以前的最短路径：beginVertex到edge.to的最短路径
    let oldPath: PathInfo<V, E> | undefined = paths.get(edge.to);
    // 如果新的路径，比老的路径还长，则return
    if (oldPath !== undefined && this.weightManager.compare(newWeight, oldPath.weight!) >= 0) return;

    if (oldPath === undefined) { // 如果以前不存在路径信息，则添加一个新的pathInfo
      oldPath = new PathInfo();
      paths.set(edge.to, oldPath);
    } else { // 存在pathInfo，则开始更新所有的路径信息，先清空 edgeInfos
      oldPath.edgeInfos.clear();
    }
    // 保存最新的路径长度
    oldPath.weight = newWeight;

    // 将最新的路径保存在 pathInfo的edgeInfos中
    for (let i = 0; i < fromPath.edgeInfos.length(); i++) {
      const edgeInfo: EdgeInfo<V, E> = fromPath.edgeInfos.get(i);
      oldPath.edgeInfos.add(edgeInfo);
    }
    oldPath.edgeInfos.add(edge.info());
  }

  private getMinPath(paths: Map<Vertex<V, E>, PathInfo<V, E>>): any {
    let iter = paths[Symbol.iterator]();
    let minEntry = iter && iter.next();
    let entry = iter.next();

    while (!entry.done) {
      if (entry.value !== undefined) {
        const pathInfo = entry.value[1];
        const minPathInfo = minEntry.value[1];

        if (pathInfo.weight) {
          if (this.weightManager.compare(pathInfo.weight, minPathInfo.weight) < 0) {
            minEntry = entry;
          }
        }
      }
      entry = iter.next();
    }
    return minEntry;
  }
}

/**
 * 顶点类
 */
class Vertex<V, E> {
  value: V;
  inEdges: Set<Edge<V, E>>;
  outEdges: Set<Edge<V, E>>;

  constructor(value: V) {
    this.value = value;
    this.inEdges = new Set();
    this.outEdges = new Set();
  }

  public equals(vertex: Vertex<V, E>) { // 节点上的值，内容相等，则节点就是同一个
    return _.isEqual(this.value, vertex.value);
  }

  toString() {
    return this.value === undefined ? "undefined" : this.value;
  }
}

/**
 * 边类
 */
class Edge<V, E> {
  from: Vertex<V, E>;
  to: Vertex<V, E>;
  weight?: E;

  constructor(from: Vertex<V, E>, to: Vertex<V, E>, weight?: E) {
    this.from = from;
    this.to = to;
    this.weight = weight;
  }

  public info(): EdgeInfo<V, E> {
    return new EdgeInfo(this.from.value, this.to.value, this.weight);
  }

  public equals(edge: Edge<V, E>) {
    // 判断连个节点是否相等
    const customizer = (v1: Vertex<V, E>, v2: Vertex<V, E>) => {
      return v1.equals(v2);
    };

    // 如果边的起点、终点，内容相等，就是同一条边，权重weight不考虑
    return _.isEqualWith(this.from, edge.from, customizer) && _.isEqualWith(this.to, edge.to, customizer);
  }

  toString() {
    return "Edge [from=" + this.from.toString() + ", to=" + this.to.toString() + ", weight=" + this.weight + "]";
  }
}