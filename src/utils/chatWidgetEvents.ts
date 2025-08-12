
export interface OpenChatWidgetDetail {
  conversaId?: string;
  empresaNome?: string;
}

export const openChatWidget = (detail: OpenChatWidgetDetail = {}) => {
  window.dispatchEvent(new CustomEvent('open-chat-widget', { detail }));
};
