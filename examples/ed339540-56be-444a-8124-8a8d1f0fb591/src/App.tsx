import React, { useState, useEffect } from 'react';
import { Wand2, Copy, RefreshCw, CheckCheck, Trash2, Clock, Settings2 } from 'lucide-react';

interface CopyHistory {
  id: string;
  topic: string;
  content: string;
  type: string;
  timestamp: number;
}

function App() {
  const [topic, setTopic] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copyType, setCopyType] = useState('marketing');
  const [length, setLength] = useState('medium');
  const [history, setHistory] = useState<CopyHistory[]>(() => {
    const saved = localStorage.getItem('copyHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tone, setTone] = useState('professional');

  useEffect(() => {
    localStorage.setItem('copyHistory', JSON.stringify(history));
  }, [history]);

  const generateCopy = () => {
    setLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      let result = '';
      
      // 根据不同类型生成不同风格的文案
      if (copyType === 'marketing') {
        const templates = [
          `${topic}是一个革命性的产品，它将彻底改变您的生活方式。通过创新的设计和卓越的性能，为用户带来前所未有的体验。`,
          `探索${topic}的无限可能，让我们一起开启崭新的篇章。独特的功能与精致的细节，诠释了品质与艺术的完美结合。`,
          `让${topic}成为您的得力助手，享受科技带来的便利与效率。简约而不简单，让生活更加轻松愉悦。`
        ];
        result = templates[Math.floor(Math.random() * templates.length)];
      } else if (copyType === 'social') {
        const templates = [
          `📢 重磅推出：${topic}！\n🌟 让生活更简单，让工作更高效\n💫 现在订购即可享受限时优惠！`,
          `✨ 你们要的${topic}终于来了！\n🎉 独特设计，卓越品质\n💝 等你来体验！`,
          `🔥 ${topic}新品上市\n⭐️ 突破传统，引领潮流\n🎁 首发特惠，先到先得！`
        ];
        result = templates[Math.floor(Math.random() * templates.length)];
      } else if (copyType === 'description') {
        const templates = [
          `${topic}采用先进技术，具有卓越的性能表现。产品设计注重细节，满足用户多样化需求。`,
          `${topic}以其优质的用户体验著称，具备完善的功能体系，是您的理想之选。`,
          `${topic}融合创新科技与人性化设计，为用户带来全新的使用体验。`
        ];
        result = templates[Math.floor(Math.random() * templates.length)];
      }

      // 根据长度调整文案
      if (length === 'short') {
        result = result.split('。')[0] + '。';
      } else if (length === 'long') {
        result = result + `\n\n作为${topic}的领先者，我们始终致力于为用户提供最优质的服务和体验。选择${topic}，选择更好的未来。`;
      }

      // 根据语气调整
      if (tone === 'casual') {
        result = result.replace(/您/g, '你').replace(/我们/g, '咱们');
      } else if (tone === 'formal') {
        result = result.replace(/你/g, '您').replace(/咱们/g, '我们');
      }

      setOutput(result);
      const newHistory: CopyHistory = {
        id: Date.now().toString(),
        topic,
        content: result,
        type: copyType,
        timestamp: Date.now()
      };
      setHistory(prev => [newHistory, ...prev].slice(0, 10));
      setLoading(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadFromHistory = (item: CopyHistory) => {
    setTopic(item.topic);
    setOutput(item.content);
    setCopyType(item.type);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">智能文案助手</h1>
              <p className="text-gray-600">输入主题，让AI为您生成专业的营销文案</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="历史记录"
              >
                <Clock className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="设置"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  主题关键词
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：智能手表、咖啡、瑜伽课程..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showSettings && (
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文案类型
                    </label>
                    <select
                      value={copyType}
                      onChange={(e) => setCopyType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="marketing">营销文案</option>
                      <option value="social">社交媒体</option>
                      <option value="description">产品描述</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      文案长度
                    </label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="short">简短</option>
                      <option value="medium">中等</option>
                      <option value="long">详细</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语气风格
                    </label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="professional">专业</option>
                      <option value="casual">轻松</option>
                      <option value="formal">正式</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                onClick={generateCopy}
                disabled={!topic || loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                生成文案
              </button>

              {output && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成结果
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                    <p className="text-gray-800 whitespace-pre-wrap">{output}</p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    {copied ? <CheckCheck className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            {showHistory && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">历史记录</h2>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      清空历史
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无历史记录</p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-lg p-4 shadow-sm relative group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800">{item.topic}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => loadFromHistory(item)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              使用
                            </button>
                            <button
                              onClick={() => deleteHistoryItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{item.content}</p>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <span>{
                            item.type === 'marketing' ? '营销文案' :
                            item.type === 'social' ? '社交媒体' :
                            '产品描述'
                          }</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;