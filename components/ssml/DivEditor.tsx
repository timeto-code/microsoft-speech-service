"use client";

import { speechSynthesis } from "@/lib/tts-synthesis";
import { useAudioPlayerStore } from "@/store/useAudioPlayerStore";
import { SsmlSection, useSSMLStore, useSsmlSectionsStore, useSsmlSynthesisStore } from "@/store/useSSMLStore";
import React, { useEffect } from "react";
import EditorMenu from "./EditorMenu";
import { cn } from "@/lib/utils";
import { useVoiceStore } from "@/store/useVoiceStore";

interface DivEditorProps {
  section: SsmlSection;
  handleDeleteSection: (id: number) => void;
}

const DivEditor = ({ section, handleDeleteSection }: DivEditorProps) => {
  const contentArea = React.useRef<HTMLDivElement>(null);

  const handleBreak = () => {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection?.toString();

    const span = document.createElement("span");
    // span.style.color = "#0078d4";
    span.textContent = `=${selectedText}ms` || "";
    span.className = "break";
    // span.setAttribute("ssml-code", `<break time="700ms" /><s />`);
    span.setAttribute("data-before", "[");
    span.setAttribute("data-after", "]");
    // span.contentEditable = "true";

    // 将span标签替换选中的文本
    const range = selection?.getRangeAt(0);
    range?.deleteContents();
    range?.insertNode(span);

    // 清除选中文本
    selection?.removeAllRanges();
  };

  const handleShengDiao = () => {
    // 获取选中的文本
    const selection = window.getSelection();
    const selectedText = selection?.toString();

    if (selectedText) return;

    const span = document.createElement("span");
    // span.style.color = "#0078d4";
    span.textContent = `#${selectedText}声` || "";
    span.className = "sheng-diao";
    // span.setAttribute(
    //   "ssml-code",
    //   `<phoneme alphabet="sapi" ph="cao 4">${selectedText}</phoneme><s />`
    // );
    span.setAttribute("data-before", "[");
    span.setAttribute("data-after", `]`);
    // span.contentEditable = "true";

    // 将span标签替换选中的文本
    const range = selection?.getRangeAt(0);
    range?.deleteContents();
    range?.insertNode(span);

    // 清除选中文本
    selection?.removeAllRanges();
  };

  // useEffect(() => {
  //   // // 粘贴时去掉格式，包括下划线、粗体等
  // }, [contentArea?.current?.onpaste]);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    // 阻止默认的粘贴行为
    event.preventDefault();

    // 从剪贴板获取纯文本格式的数据
    const plainText = event.clipboardData.getData("text/plain");

    const textArea = document.createElement("textarea");
    textArea.value = plainText;

    // 重新获取textArea的内容
    const text = textArea.value;

    // 如果是 contentEditable 元素，可以直接插入文本
    document.execCommand("insertText", false, text);
  };

  const handleSynthesis = () => {
    speechSynthesis(true, { ...section, htmlContent: contentArea.current?.innerHTML });
  };

  const handlePlay = () => {
    if (section.url) {
      useAudioPlayerStore.setState({ src: section.url });
    }
  };

  const started = useSsmlSynthesisStore((state) => state.started);

  useEffect(() => {
    useSsmlSectionsStore.setState((state) => {
      return {
        sections: state.sections.map((s) => {
          if (s.id === section.id) {
            return {
              ...s,
              htmlContent: contentArea.current?.innerHTML,
            };
          }
          return s;
        }),
      };
    });
  }, [started, section.id]);

  useEffect(() => {
    // 定义回调函数处理MutationObserver的变动
    const callback = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (!element) return;
            const name = element.getAttribute("name");
            const spans = document.querySelectorAll(`span[name="${name}"]`);
            spans.forEach((span) => {
              const type = span.getAttribute("type");
              if (type) {
                span.insertAdjacentHTML("beforebegin", span.innerHTML);
                span.remove();
              } else {
                span.remove();
              }
            });
          }
        });

        // 移除空div、span标签
        contentArea.current?.childNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (!element) return;
            if (element.nodeName === "DIV" || element.nodeName === "SPAN") {
              if (element.innerHTML === "") {
                element.remove();
              }
            }
          }
        });
      }
    };

    // 创建MutationObserver实例
    const observer = new MutationObserver(callback);

    // 配置MutationObserver
    const config = { childList: true, subtree: true };

    // 开始观察目标节点
    if (contentArea.current) {
      observer.observe(contentArea.current, config);
    }

    // 在组件卸载时断开观察器
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="border border-zinc-500/20 rounded-sm">
      <div className="bg-zinc-500/10 border-zinc-500/20 flex items-center h-9 px-2">
        <span className={cn("text-sky-500 w-24 select-none")} contentEditable={false}>
          {section?.voice?.LocalName ?? "未选择声音"}
        </span>
        <EditorMenu
          handleSynthesis={handleSynthesis}
          handlePlay={handlePlay}
          handleDelete={() => {
            handleDeleteSection(section.id);
          }}
        />
      </div>
      <div className="flex gap-2">
        <div
          ref={contentArea}
          id="editor"
          className="relative outline-none py-1 px-2 text-lg w-full"
          contentEditable
          onPaste={handlePaste}
          onFocus={() => {
            useSSMLStore.setState({ currentVoceSection: section });
            if (section.voice) {
              useVoiceStore.setState({ voice: section.voice });
            } else {
              useVoiceStore.setState({ voice: null });
            }
          }}
        />
      </div>
    </div>
  );
};

export default DivEditor;
