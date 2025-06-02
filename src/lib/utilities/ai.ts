/** @format */

import axios from 'axios';

type ApiResponse = {
  response?: string;
  data?: any;
  r?: { meta?: string };
  BK9?: any;
};

const AI = {
  async gemini(query: string): Promise<string> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://nikka-api.vercel.app/ai/gemini?q=${encodeURIComponent(query)}&apiKey=nikka`
      );
      return data.response ?? 'No response from Gemini.';
    } catch (error: any) {
      console.error('Error fetching Gemini API response:', error.message);
      return 'An error occurred while fetching the response.';
    }
  },

  async groq(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://nikka-api.vercel.app/ai/groq?q=${encodeURIComponent(query)}&apiKey=nikka`
      );
      return data.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async llama(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/llama?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async meta(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://apii.ambalzz.biz.id/api/openai/meta-ai?ask=${encodeURIComponent(query)}`
      );
      return data.r?.meta;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async dalle(prompt: string): Promise<string> {
    try {
      return `https://bk9.fun/ai/magicstudio?prompt=${encodeURIComponent(prompt)}`;
    } catch (error) {
      console.error(error);
      return 'An error occurred generating the image.';
    }
  },

  async gpt(query: string, userId: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/GPT4o?q=${encodeURIComponent(query)}&userId=${userId}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async claude(query: string, userId: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/Claude-Opus?q=${encodeURIComponent(query)}&userId=${userId}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async hakiu(query: string, userId: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/Claude-Haiku?q=${encodeURIComponent(query)}&userId=${userId}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async shaka(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/chataibot?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async nikka(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://nikka-api.vercel.app/ai/nikka?q=${encodeURIComponent(query)}`
      );
      return data.data;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async jeevs(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/jeeves-chat?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async maths(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/mathssolve?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async flux(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/fluximg?q=${encodeURIComponent(query)}`
      );
      return data.BK9?.[0];
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async blackbox(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/blackbox?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  async you(query: string): Promise<any> {
    try {
      const { data } = await axios.get<ApiResponse>(
        `https://bk9.fun/ai/you?q=${encodeURIComponent(query)}`
      );
      return data.BK9;
    } catch (error) {
      console.error(error);
      return error;
    }
  },
};

export default AI;
