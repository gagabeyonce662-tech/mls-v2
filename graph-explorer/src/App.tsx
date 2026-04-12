import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Search, Layers, X, Target, FileCode, FileText, ImageIcon, Box, Database, Monitor, Globe, Code2, Loader2, Menu } from 'lucide-react'
import unifiedGraph from './data/unified.json'
import backendGraph from './data/backend.json'
import frontendGraph from './data/frontend.json'
import unifiedLabels from './data/unified-labels.json'
import backendLabels from './data/backend-labels.json'
import frontendLabels from './data/frontend-labels.json'
import './index.css'

const COMMUNITY_COLORS = [
  "#38bdf8", "#818cf8", "#c084fc", "#fb7185", "#fb923c", "#facc15", "#4ade80", "#2dd4bf",
  "#a78bfa", "#f472b6", "#94a3b8", "#60a5fa", "#f87171", "#fbbf24", "#34d399", "#fb923c",
];

interface Node {
  id: string;
  label: string;
  community: number;
  source_file: string;
  file_type: string;
  source_location?: string;
  x?: number;
  y?: number;
  neighbors?: Node[];
  links?: any[];
}

type Workspace = 'unified' | 'backend' | 'frontend';

function App() {
  const fgRef = useRef<any>(null);
  const [workspace, setWorkspace] = useState<Workspace>('unified')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [highlightCommunity, setHighlightCommunity] = useState<number | null>(null)
  const [labelDensity, setLabelDensity] = useState<number>(1.2)
  const [focusLevel, setFocusLevel] = useState<number>(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  // Code snippet state
  const [codeSnippet, setCodeSnippet] = useState<{snippet: string, startLine: number, targetLine: number} | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch code when node selection changes
  useEffect(() => {
    if (selectedNode && selectedNode.source_file) {
        setIsLoadingCode(true);
        setCodeSnippet(null);
        
        const line = selectedNode.source_location ? selectedNode.source_location : 'L1';
        fetch(`/api/code?file=${encodeURIComponent(selectedNode.source_file)}&line=${line}`)
            .then(res => res.json())
            .then(data => {
                setCodeSnippet(data);
                setIsLoadingCode(false);
            })
            .catch(err => {
                console.error("Failed to fetch code:", err);
                setIsLoadingCode(false);
            });
    } else {
        setCodeSnippet(null);
    }
  }, [selectedNode]);

  // Determine which dataset to use
  const activeDataset = useMemo(() => {
    switch(workspace) {
        case 'backend': return { graph: backendGraph, labels: backendLabels };
        case 'frontend': return { graph: frontendGraph, labels: frontendLabels };
        default: return { graph: unifiedGraph, labels: unifiedLabels };
    }
  }, [workspace]);

  const data = useMemo(() => {
    const nodes: Node[] = activeDataset.graph.nodes.map(n => ({ ...n, neighbors: [], links: [] }));
    const nodesById = Object.fromEntries(nodes.map(node => [node.id, node]));
    
    const links = activeDataset.graph.links.map(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        
        const sourceNode = nodesById[sourceId];
        const targetNode = nodesById[targetId];
        
        if (sourceNode && targetNode) {
            sourceNode.neighbors?.push(targetNode);
            targetNode.neighbors?.push(sourceNode);
        }

        return {
          ...l,
          source: sourceId,
          target: targetId
        };
    });

    return { nodes, links };
  }, [activeDataset]);

  const communities = useMemo(() => {
    const counts: Record<number, number> = {}
    data.nodes.forEach(n => {
      counts[n.community] = (counts[n.community] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40)
  }, [data.nodes])

  const focusSet = useMemo(() => {
    if (!selectedNode || focusLevel === 0) return null;
    const set = new Set<string>([selectedNode.id]);
    selectedNode.neighbors?.forEach(n => set.add(n.id));
    if (focusLevel >= 2) {
      selectedNode.neighbors?.forEach(n => {
        n.neighbors?.forEach(nn => set.add(nn.id));
      });
    }
    return set;
  }, [selectedNode, focusLevel]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 400);
        fgRef.current.zoom(1.8, 400);
    }
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'code': return <FileCode size={14} />;
      case 'document': return <FileText size={14} />;
      case 'image': return <ImageIcon size={14} />;
      default: return <Box size={14} />;
    }
  };

  const handleWorkspaceChange = (ws: Workspace) => {
    setWorkspace(ws);
    setSelectedNode(null);
    setSearchTerm('');
    setHighlightCommunity(null);
    setFocusLevel(0);
    setIsMenuOpen(false); // Close menu on workspace change
  };

  return (
    <div className="graph-container">
      {/* Mobile Menu Toggle */}
      <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar with mobile state */}
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: '#38bdf8', padding: 8, borderRadius: 8 }}>
                <Target size={20} color="black" />
            </div>
            <div>
                <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Graphify Pro</h1>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Structure Explorer</p>
            </div>
        </div>

        <div className="workspace-switcher">
            <button 
                className={`ws-btn ${workspace === 'unified' ? 'active' : ''}`}
                onClick={() => handleWorkspaceChange('unified')}
            >
                <Globe size={14} /> Unified
            </button>
            <button 
                className={`ws-btn ${workspace === 'backend' ? 'active' : ''}`}
                onClick={() => handleWorkspaceChange('backend')}
            >
                <Database size={14} /> Backend
            </button>
            <button 
                className={`ws-btn ${workspace === 'frontend' ? 'active' : ''}`}
                onClick={() => handleWorkspaceChange('frontend')}
            >
                <Monitor size={14} /> Frontend
            </button>
        </div>

        <div className="section-title">
          Label Density
        </div>
        <div style={{ padding: '0 8px' }}>
          <input 
            type="range" 
            min="0.5" 
            max="4" 
            step="0.1" 
            value={labelDensity}
            onChange={(e) => setLabelDensity(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>
            <span>Clean</span>
            <span>Detailed</span>
          </div>
        </div>
        
        <div className="search-container" style={{ marginTop: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
            <input 
              className="search-input"
              style={{ paddingLeft: 36 }}
              placeholder={`Search ${workspace}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="section-title">
          <Layers size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Functional Communities
        </div>
        <div className="community-list" style={{ flex: 1, overflowY: 'auto' }}>
          <div 
            className="community-item" 
            style={{ fontWeight: highlightCommunity === null ? 600 : 400 }}
            onClick={() => setHighlightCommunity(null)}
          >
            <div className="community-color" style={{ border: '1px solid #64748b' }} />
            Whole System Map
          </div>
          {communities.map(([com, count]) => (
            <div 
              key={com} 
              className="community-item"
              onClick={() => setHighlightCommunity(Number(com))}
              style={{ 
                opacity: highlightCommunity === null || highlightCommunity === Number(com) ? 1 : 0.4,
                borderLeft: highlightCommunity === Number(com) ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              <div 
                className="community-color" 
                style={{ background: COMMUNITY_COLORS[Number(com) % COMMUNITY_COLORS.length] }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem' }}>{(activeDataset.labels as any)[com] || `Community ${com}`}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{count} items</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNode && (
        <div className="node-details animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 {getIconForType(selectedNode.file_type)}
                 <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedNode.label}</h2>
             </div>
            <X 
              size={18} 
              style={{ cursor: 'pointer', color: '#64748b' }} 
              onClick={() => { setSelectedNode(null); setFocusLevel(0); }} 
            />
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Scope</span>
            <span className="tag" style={{ background: COMMUNITY_COLORS[selectedNode.community % COMMUNITY_COLORS.length] + '33', color: COMMUNITY_COLORS[selectedNode.community % COMMUNITY_COLORS.length] }}>
                {(activeDataset.labels as any)[selectedNode.community] || 'General'}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Path</span>
            <span className="detail-value" style={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>{selectedNode.source_file}</span>
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
            <div className="detail-label" style={{ marginBottom: 10 }}>Focus Mode</div>
            <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setFocusLevel(0)}
                  className={`focus-btn ${focusLevel === 0 ? 'active' : ''}`}
                >Global</button>
                <button 
                  onClick={() => setFocusLevel(1)}
                  className={`focus-btn ${focusLevel === 1 ? 'active' : ''}`}
                >Neighbors</button>
                <button 
                  onClick={() => setFocusLevel(2)}
                  className={`focus-btn ${focusLevel === 2 ? 'active' : ''}`}
                >2-Hops</button>
            </div>
          </div>

          <div className="code-view-container">
            <div className="section-title" style={{ marginTop: 0, paddingBottom: 8 }}>
                <Code2 size={12} style={{ marginRight: 6 }} /> Source Preview
            </div>
            <div className="code-block">
                {isLoadingCode ? (
                    <div className="code-loader">
                        <Loader2 size={24} className="spin" />
                    </div>
                ) : (codeSnippet && codeSnippet.snippet) ? (
                    <pre>
                        {codeSnippet.snippet.split('\n').map((line, i) => {
                            const lineNum = codeSnippet.startLine + i;
                            const isTarget = lineNum === codeSnippet.targetLine;
                            return (
                                <div key={i} className={`code-line ${isTarget ? 'highlight' : ''}`}>
                                    <span className="line-number">{lineNum}</span>
                                    <span className="line-content">{line}</span>
                                </div>
                            );
                        })}
                    </pre>
                ) : (
                    <div className="code-empty">No preview available</div>
                )}
            </div>
          </div>
          
          <div style={{ marginTop: 16, paddingBottom: 24 }}>
              <div className="detail-label">Connections ({selectedNode.neighbors?.length})</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedNode.neighbors?.slice(0, 15).map(n => (
                      <div key={n.id} onClick={() => handleNodeClick(n)} className="neighbor-pill">
                          {n.label}
                      </div>
                  ))}
                  {selectedNode.neighbors && selectedNode.neighbors.length > 15 && (
                      <div style={{ padding: '4px', fontSize: '0.7rem', color: '#64748b' }}>+ {selectedNode.neighbors.length - 15} more...</div>
                  )}
              </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />}

      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={windowSize.width}
        height={windowSize.height}
        nodeLabel="label"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
            const isSelected = selectedNode?.id === node.id;
            const isMatch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
            const degree = node.neighbors?.length || 0;
            
            // Dynamic radius based on degree
            const r = 4 + Math.sqrt(degree) * 1.5;
            
            const fontSize = 12/globalScale;
            ctx.font = `${isSelected ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;

            const communityColor = COMMUNITY_COLORS[(node as Node).community % COMMUNITY_COLORS.length];
            const isDimmed = (highlightCommunity !== null && node.community !== highlightCommunity) || 
                             (focusSet !== null && !focusSet.has(node.id));

            if (isSelected || isMatch) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI, false);
                ctx.fillStyle = isMatch ? '#facc1533' : '#ffffff33';
                ctx.fill();
                ctx.strokeStyle = isMatch ? '#facc15' : '#fff';
                ctx.lineWidth = 2/globalScale;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = isDimmed ? '#ffffff11' : communityColor;
            ctx.fill();
        }}
        onRenderFramePost={(ctx, globalScale) => {
            const nodes = data.nodes as Node[];
            nodes.forEach(node => {
                const isSelected = selectedNode?.id === node.id;
                const isMatch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
                const degree = node.neighbors?.length || 0;
                const isDimmed = (highlightCommunity !== null && node.community !== highlightCommunity) || 
                                 (focusSet !== null && !focusSet.has(node.id));

                const r = 4 + Math.sqrt(degree) * 1.5;
                const showLabel = isSelected || isMatch || globalScale > 2.5 || (globalScale > labelDensity && degree > 2);
                
                if (showLabel) {
                    const rawLabel = node.label;
                    let displayLabel = rawLabel;
                    
                    if (rawLabel.split(' ').length > 3 || rawLabel.length > 25) {
                        if (node.file_type === 'document' || node.file_type === 'code') {
                            displayLabel = rawLabel.length > 20 ? rawLabel.slice(0, 17) + '...' : rawLabel;
                        }
                    }

                    const fontSize = 12/globalScale;
                    ctx.font = `${isSelected ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;
                    ctx.fillStyle = isDimmed ? '#ffffff22' : (isSelected ? '#fff' : 'rgba(255, 255, 255, 0.7)');
                    ctx.fillText(displayLabel, (node.x || 0) + r + 3, (node.y || 0) + 3);
                }
            });
        }}
        linkVisibility={l => {
            if (focusSet && (!focusSet.has((l.source as any).id) || !focusSet.has((l.target as any).id))) return false;
            if (highlightCommunity !== null) {
                return (l.source as any).community === highlightCommunity && (l.target as any).community === highlightCommunity;
            }
            return true;
        }}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkWidth={1.5}
        linkColor={() => 'rgba(255, 255, 255, 0.4)'}
        onNodeClick={handleNodeClick}
        backgroundColor="#020617"
      />
    </div>
  )
}

export default App
