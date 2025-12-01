import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { askAssistant } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [userName, setUserName] = useState('User');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load user profile to get name
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile();
        if (profile && profile.name) {
          setUserName(profile.name);
        }
      } catch (error) {
        console.error('Error loading profile for AI Assistant:', error);
      }
    };
    loadProfile();
  }, []);

  // Initialize welcome message with user's name
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: t('aiAssistant.welcome', { name: userName }),
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAssistant(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: t('aiAssistant.aiError'),
        description: t('aiAssistant.aiErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    t('aiAssistant.quickPrompt1'),
    t('aiAssistant.quickPrompt2'),
    t('aiAssistant.quickPrompt3'),
    t('aiAssistant.quickPrompt4')
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">{t('aiAssistant.title')}</h1>
        <p className="text-muted-foreground">{t('aiAssistant.subtitle')}</p>
      </div>

      {/* Chat Container */}
      <Card className="glass-card p-6 h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'gradient-primary' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                      A
                    </div>
                  ) : (
                    <Bot className="w-8 h-8 text-accent" />
                  )}
                </div>
                <div className={`rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Bot className="w-8 h-8 text-accent" />
                </div>
                <div className="rounded-2xl p-4 bg-muted">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">{t('aiAssistant.quickQuestions')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="text-left p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Sparkles className="w-4 h-4 inline mr-2 text-accent" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('aiAssistant.placeholder')}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="gradient-accent text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card p-4 border-primary/30">
          <h4 className="font-display font-semibold mb-2">{t('aiAssistant.financialAnalysis')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('aiAssistant.financialAnalysisDesc')}
          </p>
        </Card>

        <Card className="glass-card p-4 border-accent/30">
          <h4 className="font-display font-semibold mb-2">{t('aiAssistant.smartRecommendations')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('aiAssistant.smartRecommendationsDesc')}
          </p>
        </Card>

        <Card className="glass-card p-4 border-success/30">
          <h4 className="font-display font-semibold mb-2">{t('aiAssistant.goalCoaching')}</h4>
          <p className="text-sm text-muted-foreground">
            {t('aiAssistant.goalCoachingDesc')}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistant;
