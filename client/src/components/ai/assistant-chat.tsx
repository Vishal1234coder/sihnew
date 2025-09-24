import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthHeaders, useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Settings, Bot, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ChatMessage } from "@/lib/types";

export default function AIAssistantChat() {
  const { user } = useAuth();
  const authHeaders = useAuthHeaders();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Get patient info if user is a patient
  const { data: patient } = useQuery({
    queryKey: ["/api/patients", "by-user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/patients?userId=${user?.id}`, {
        headers: authHeaders,
      });
      const patients = await response.json();
      return patients[0];
    },
    enabled: !!user?.id && user?.role === "patient",
  });

  // Get recent conversations
  const { data: conversations = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/ai/conversations", patient?.id],
    queryFn: async () => {
      if (!patient?.id) return [];
      const response = await fetch(`/api/ai/conversations/${patient.id}`, {
        headers: authHeaders,
      });
      const data = await response.json();
      return data.map((conv: any) => ({
        ...conv,
        timestamp: new Date(conv.createdAt),
        patientName: user?.name,
      }));
    },
    enabled: !!patient?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, language }: { message: string; language: string }) => {
      return apiRequest("POST", "/api/ai/chat", {
        message,
        language,
        patientId: patient?.id,
      });
    },
    onSuccess: (response) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
      toast({
        title: "Message sent",
        description: "AI assistant has responded to your query",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message to AI assistant",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      language: selectedLanguage,
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60)),
      'hour'
    );
  };

  // Mock data for demo when no real conversations exist
  const mockConversations: ChatMessage[] = [
    {
      id: "1",
      message: "Mujhe chakkar aa raha hai. Ye dawa ki wajah se ho sakta hai?",
      response: "यह चक्कर आना आपकी नई दवा का साइड इफेक्ट हो सकता है। कृपया तुरंत अपने डॉक्टर से संपर्क करें।",
      language: "hi",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      patientName: user?.name || "Patient",
    },
    {
      id: "2",
      message: "What time should I take my evening medication?",
      response: "Based on your prescription, take your Metformin at 7 PM with dinner. Would you like me to set a reminder?",
      language: "en",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      patientName: user?.name || "Patient",
    },
  ];

  const displayConversations = conversations.length > 0 ? conversations : mockConversations;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>AI Assistant</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                Online
              </Badge>
              <Button variant="ghost" size="sm" data-testid="button-ai-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Language:</label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <Textarea
              placeholder={selectedLanguage === "hi" 
                ? "अपना सवाल यहाँ लिखें..."
                : "Ask about your medicines, side effects, or any health concerns..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-ai-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>

          {/* Quick Questions */}
          <div>
            <p className="text-sm font-medium mb-2">Quick Questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                "When should I take my next dose?",
                "What are the side effects?",
                "Can I take this with food?",
                selectedLanguage === "hi" ? "दवा का समय क्या है?" : "What time is my medicine?",
              ].map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2 px-3 text-xs"
                  onClick={() => setMessage(question)}
                  data-testid={`button-quick-question-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Conversations & Insights */}
      <div className="space-y-6">
        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {displayConversations.map((conversation) => (
                  <Card key={conversation.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {conversation.patientName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <div className="flex items-start space-x-2">
                          <UserIcon className="w-3 h-3 mt-1 text-blue-600" />
                          <p className="text-xs text-blue-800">{conversation.message}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <div className="flex items-start space-x-2">
                          <Bot className="w-3 h-3 mt-1 text-emerald-600" />
                          <p className="text-xs text-emerald-800">{conversation.response}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Assistant Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-background border border-border rounded-lg p-4">
              <h5 className="text-sm font-medium mb-2">Common Queries</h5>
              <div className="space-y-2">
                {[
                  { query: "Medicine timing", percentage: 34 },
                  { query: "Side effects", percentage: 28 },
                  { query: "Dosage questions", percentage: 22 },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.query}</span>
                    <span className="text-foreground font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <h5 className="text-sm font-medium mb-2">Language Usage</h5>
              <div className="space-y-2">
                {[
                  { language: "Hindi", percentage: 62 },
                  { language: "English", percentage: 38 },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.language}</span>
                    <span className="text-foreground font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <h5 className="text-sm font-medium mb-2">Satisfaction Rate</h5>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "89%" }}></div>
                </div>
                <span className="text-sm font-medium text-foreground">89%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Based on 247 interactions this week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
