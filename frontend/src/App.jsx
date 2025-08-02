import { BsSend } from "react-icons/bs";
import { GiBrain } from "react-icons/gi";
import { MdDeleteSweep } from "react-icons/md";
import { BsRobot } from "react-icons/bs";
import geminiImg from "./assets/gemini.png";
import userImg from "./assets/user.jpg";
import toggle from "./assets/toggle.svg";
import toggleR from "./assets/toggleR.svg";
import { RiFilePdf2Line } from "react-icons/ri";
import { SiGooglegemini } from "react-icons/si";
import { GoDotFill } from "react-icons/go";

import { useEffect, useRef, useState } from "react";
import run from "./gemini/config";
import { useMutation } from "@tanstack/react-query";

function App() {
  const inputRef = useRef(null);
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const [historyMood, setHistoryMood] = useState(false);
  const [historySID, setHistorySID] = useState(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessages] = useState(() => {
    const savedResult = sessionStorage.getItem("messages");
    return savedResult ? JSON.parse(savedResult) : [];
  });

  // Get Local Storage Data
  const savedResult = localStorage.getItem("history");
  const savedFilesLocal = localStorage.getItem("pdfFile");
  const savedFiles = JSON.parse(savedFilesLocal);
  const history = savedResult ? JSON.parse(savedResult) : [];
  const uniqueDates = [...new Set(history.map((item) => item.date))];
  const [premium, setPremium] = useState(false);
  const [filePath, setFilePath] = useState({
    name: "",
    path: "",
  });

  //Save Uploaded FilePath
  const savePathToHistory = (filename, filepath) => {
    const newPdfData = {
      pdfId: Math.floor(1000 + Math.random() * 9000),
      date: getFormattedDate(),
      name: filename,
      path: filepath,
    };

    const existingHistory = JSON.parse(localStorage.getItem("pdfFile")) || [];
    existingHistory.push(newPdfData);
    localStorage.setItem("pdfFile", JSON.stringify(existingHistory));
  };

  const { mutate: uploadFileMutation, isPending } = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFilePath((prev) => ({
        ...prev,
        name: data.filename,
        path: data.path,
      }));
      savePathToHistory(data.filename, data.path);
    },
    onError: (error) => {
      console.error("Upload error:", error);
    },
  });
  const { mutate: sendPathMutation, isPending: sendPathPending } = useMutation({
    mutationFn: async (path) => {
      const response = await fetch("/api/setFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setFilePath((prev) => ({
        ...prev,
        path: data.path,
      }));
    },
    onError: (error) => {
      console.error("Upload error:", error);
    },
  });
  const { mutate: askQuestion, isPending: askPending } = useMutation({
    mutationFn: async (qs) => {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qs }),
      });
      const result = res.json();
      return result;
    },
    onSuccess: (data) => {
      saveToMessage({ type: "gemini", text: data.ans });
    },
    onError: (error) => {
      saveToMessage({ type: "gemini", text: "I am currently offline" });
      console.error("Error On Ask:", error);
    },
  });

  const handlePathSend = (path, name) => {
    sendPathMutation(path);
    setPremium(true);
    setFilePath((prev) => ({
      ...prev,
      name,
    }));
  };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      alert("File must be less than 2MB.");
      return;
    }

    uploadFileMutation(selectedFile);
  };

  //Filter Session By Date For Left Sidebar
  const result = uniqueDates.map((date) => {
    const sessionsOnDate = history.filter((item) => item.date === date);

    const contents = sessionsOnDate
      .map((session) => {
        const lastInput = session.data
          .filter((msg) => msg.type === "input")
          .pop();

        return lastInput
          ? {
              lastMessage: lastInput.text,
              id: session.sessionId,
            }
          : null;
      })
      .filter(Boolean); // Remove nulls

    return {
      date,
      contents,
    };
  });

  //GO TO A SESSION & Set Previous Message to Show
  const findSession = (id) => {
    const gotSession = history.filter((element) => element.sessionId == id);
    console.log(gotSession);
    if (gotSession) {
      setHistoryMood(true); //Not Saved History Session Twice
      setHistorySID(gotSession[0].sessionId);
      setMessages(gotSession[0].data);

      if (gotSession[0].path !== null) {
        setFilePath((prev) => ({
          ...prev,
          name: gotSession[0].name,
        }));
        sendPathMutation(gotSession[0].path);
        setPremium(true);
      }
    } else {
      return null;
    }
  };

  //Saved New Message
  const saveToMessage = (newItem) => {
    setMessages((prevMessages) => {
      const updatedItems = [...prevMessages, newItem];
      sessionStorage.setItem("messages", JSON.stringify(updatedItems));
      return updatedItems;
    });
  };

  //Generate Current Date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  //Save New Session in Storage With Date & ID
  const saveToHistory = () => {
    if (message.length > 0) {
      const newSessionData = {
        sessionId: Math.floor(1000 + Math.random() * 9000),
        date: getFormattedDate(),
        data: message,
        path: filePath.path,
        name: filePath.name,
      };

      const existingHistory = JSON.parse(localStorage.getItem("history")) || [];
      existingHistory.push(newSessionData);
      localStorage.setItem("history", JSON.stringify(existingHistory));
    }
  };

  //update a history with new messages
  function updateSession() {
    const raw = localStorage.getItem("history");
    if (!raw) return;

    const updateFn = (session) => {
      session.data = message;
      return session;
    };

    const sessions = JSON.parse(raw);
    const updated = sessions.map((session) =>
      session.sessionId === historySID ? updateFn(session) : session
    );

    localStorage.setItem("history", JSON.stringify(updated));
  }

  //Delete History Button Function
  const clearHistory = () => {
    localStorage.removeItem("history");
  };

  //Delete PDF Button Function
  const clearFiles = () => {
    localStorage.removeItem("pdfFile");
  };

  //Save Session When Page unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (historyMood === false) {
        saveToHistory();
      } else {
        updateSession();
      }
      sessionStorage.removeItem("messages");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, historyMood]);

  //Message Sent Button Function
  const submit = async (e) => {
    e.preventDefault();
    const prompt = inputRef.current.value;
    if (!premium) {
      saveToMessage({ type: "input", text: prompt });
      inputRef.current.value = "";
      const result = await onSent(prompt);
      saveToMessage({ type: "gemini", text: result });
    } else {
      saveToMessage({ type: "input", text: prompt });
      inputRef.current.value = "";
      askQuestion(prompt);
    }
  };

  //Sent & Get Messages From Gemini run Function
  const onSent = async (prompt) => {
    setLoading(true);
    try {
      const response = await run(prompt);
      return response;
    } catch {
      return "I'm Now Offline";
    } finally {
      setLoading(false);
    }
  };

  //End A Session For New Chat Button
  const endSessionStorage = () => {
    if (historyMood === false) {
      saveToHistory();
    } else {
      updateSession();
    }
    setFilePath({ name: "", path: "" });
    setHistoryMood(false);

    sessionStorage.removeItem("messages");
    setMessages([]);
  };

  //Scroll To Bottom
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  //Scroll Down Conversation To Last Message
  const bottomRef = useRef();
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [message]);

  //Custom Button CSS
  const customCss = `
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes shimmer-spin {
      to {
        --angle: 360deg;
      }
    }
  `;

  return (
    <>
      <div className=" w-full h-screen max-h-screen overflow-hidden scrollbar-none flex justify-end">
        {/* Left Side Panel Section */}
        <section
          className={`w-[30%] ${
            premium
              ? "bg-gradient-to-tr from-[#2e1f9c] to-[#000000]"
              : "bg-gradient-to-tr from-[#030405] to-[#220655]"
          } max-h-screen space-y-2 ${
            checked ? "xs:block sm:hidden" : "xs:hidden sm:block"
          } transition-all duration-500 ease-in-out h-full overflow-y-auto overflow-x-hidden scrollbar-none`}
        >
          <div className="pt-3 px-2 flex flex-col sm:flex-row sm:justify-between sm:items-center items-start gap-2">
            <img
              onClick={() => setChecked((checked) => !checked)}
              src={toggle}
              alt=""
              className={` ${
                checked ? "xs:block sm:hidden" : "xs:hidden sm:block"
              } cursor-pointer`}
            />
            <div className="flex gap-1 justify-start items-center text-white">
              {premium ? (
                <div
                  onClick={() => setPremium(false)}
                  className="flex gap-1 justify-start items-center cursor-pointer hover:text-sky-400 hover:scale-105 hover:-translate-y-1 transition-transform delay-100 duration-200"
                >
                  <SiGooglegemini className="animate-pulse text-sky-300" />
                  <p className="text-xs ">Try Gemini</p>
                </div>
              ) : (
                <div
                  onClick={() => setPremium(true)}
                  className="flex gap-1 justify-start items-center cursor-pointer hover:text-sky-400 hover:scale-105 hover:-translate-y-1 transition-transform delay-100 duration-200"
                >
                  <RiFilePdf2Line className="text-sky-300 animate-pulse" />
                  <p className="text-xs ">Attach PDF</p>
                </div>
              )}
            </div>
          </div>

          <header className="flex flex-col md:flex-row justify-start items-center text-white my-5 px-2 xs:gap-1 sm:gap-2">
            <div className="">
              <GiBrain className="xs:text-2xl sm:text-5xl animate-pulse" />
            </div>
            <div className="">
              <p className="xs:text-[12px] sm:text-lg font-spartan">MahimAI</p>
              <p className="xs:text-[10px] sm:text-sm font-kaushan">
                by Gemini
              </p>
            </div>
          </header>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e)}
            hidden
            ref={fileRef}
          />
          <div className="px-2 sm:py-2 flex flex-col md:flex-row justify-center gap-2 items-center">
            <div className="flex items-center justify-center font-sans w-full">
              <style>{customCss}</style>
              <button
                className="relative inline-flex items-center justify-center p-[1.5px] bg-black rounded-full overflow-hidden group w-full"
                onClick={() => endSessionStorage()}
              >
                <div
                  className="absolute inset-0 w-full "
                  style={{
                    background:
                      "conic-gradient(from var(--angle), transparent 25%, #06b6d4, transparent 50%)",
                    animation: "shimmer-spin 2.5s linear infinite",
                  }}
                />
                <div className="relative z-10 inline-flex items-center justify-center w-full h-full md:px-4 lg:px-8 py-2 text-black bg-sky-400 rounded-full transition-colors duration-300 font-kaushan sm:text-lg">
                  New_Chat
                </div>
              </button>
            </div>

            {premium && (
              <div className="flex items-center justify-center font-sans w-full">
                <style>{customCss}</style>
                <button className="relative inline-flex items-center justify-center p-[1.5px] bg-black  rounded-full overflow-hidden group w-full">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "conic-gradient(from var(--angle), transparent 25%, #06b6d4, transparent 50%)",
                      animation: "shimmer-spin 2.5s linear infinite",
                    }}
                  />
                  <div className="relative z-10 inline-flex items-center justify-center w-full h-full md:px-4 lg:px-8 py-2 text-black  bg-sky-400  rounded-full group-hover:bg-gray-100  transition-colors duration-300">
                    {filePath.name ? (
                      <p className="sm:text-lg font-kaushan">Uploaded</p>
                    ) : (
                      <p
                        onClick={() => fileRef.current?.click()}
                        className=" sm:text-lg font-kaushan"
                      >
                        {isPending || sendPathPending
                          ? "Uploading..."
                          : "Upload"}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-2  border-b-[1px] border-gray-600">
            <p className="text-white pb-1 xs:text-sm sm:text-md font-kaushan">
              History
            </p>
            <MdDeleteSweep
              onClick={() => {
                clearHistory(), window.location.reload();
              }}
              className="text-gray-400 hover:scale-110 hover:text-white cursor-pointer transition-transform delay-100 duration-200"
            />
          </div>

          <div className="max-h-[220px] px-2 space-y-2 overflow-y-auto scrollbar-none hover:scrollbar-thin ">
            {result?.map((session, ind) => (
              <div key={ind} className="space-y-1">
                <p className="text-xs">{session.date}</p>
                {session.contents?.map((data, index) => (
                  <p
                    onClick={() => findSession(data.id)}
                    key={index}
                    className="line-clamp-2 xs:text-sm sm:text-md font-spartan text-white hover:text-sky-400 cursor-pointer"
                  >
                    {data.lastMessage}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center px-2  border-b-[1px] border-gray-600">
            <p className="text-white pb-1 xs:text-sm sm:text-md font-kaushan">
              PDF
            </p>
            <MdDeleteSweep
              onClick={() => {
                clearFiles(), window.location.reload();
              }}
              className="text-gray-400 hover:scale-110 hover:text-white cursor-pointer transition-transform delay-100 duration-200"
            />
          </div>
          <div className="max-h-[170px] px-2  overflow-y-auto scrollbar-none hover:scrollbar-thin ">
            {savedFiles?.map((file) => (
              <div
                key={file.pdfId}
                className="space-y-2 "
                onClick={() => handlePathSend(file.path, file.name)}
              >
                <p className="line-clamp-2 text-xs  font-nunito text-white hover:text-sky-400 cursor-pointer">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Chats Right Panel Section */}
        <section
          className={`${
            checked ? "xs:w-[70%] sm:w-[100%]" : "xs:w-[100%] sm:w-[80%]"
          } bg-[#d9f1f7] max-h-screen min-h-screen transition-all duration-1000 ease-in-out`}
        >
          <div className="w-full flex flex-col  min-h-screen">
            {/* Header Navbar */}
            <header
              className={`h-12 flex justify-between items-center gap-1 px-2 sm:px-5 ${
                checked ? "xs:pl-2 sm:pl-5" : "pl-4"
              } shadow-md bg-[#d9f1f7]`}
            >
              <div className="flex items-center gap-2">
                <img
                  onClick={() => setChecked(!checked)}
                  src={toggleR}
                  alt=""
                  className={` ${
                    !checked ? "xs:block sm:hidden" : "xs:hidden sm:block"
                  } cursor-pointer`}
                />
                <img
                  src={geminiImg}
                  alt=""
                  className="w-6 rounded-full cursor-pointer"
                />
                <p className="text-black font-semibold font-spartan text-xl">
                  MahimAI
                </p>
              </div>
              { premium && <div className="flex items-center gap-[2px] border-2  rounded-xl px-1 sm:px-2 sm:py-1 border-sky-100 shadow shadow-sky-300">
                
                <div>
                  {premium &&
                    (filePath.name ? <GoDotFill className="text-green-400 w-5 h-5" /> : <GoDotFill className="text-red-500 w-5 h-5" />)}
                </div>
                <p className="text-xs max-w-24 sm:max-w-full line-clamp-1  text-black font-semibold font-spartan sm:text-sm ">
                  {premium &&
                    (filePath.path ? filePath.name ? filePath.name : "No File Found For This Chat" : "No File Selected")}
                </p>
              </div>}
            </header>

            {/* Main Chat Box */}
            <main className="w-full mx-auto max-h-[calc(100vh-108px)] min-h-[calc(100vh-108px)] overflow-y-auto scrollbar-none  pt-2 px-5">
              {message.length == 0 && (
                <div className=" text-black ">
                  <div className="flex justify-center items-center sm:pt-20">
                    <BsRobot className="text-6xl text-black" />
                  </div>
                  <p className="text-center text-4xl font-semibold font-kaushan pt-2">
                    Welcome to MahimAI
                  </p>
                  <p className=" text-center text-sm font-semibold font-nunito pt-1">
                    Your personal AI compinion by Gemini
                  </p>
                  <div className="xs:w-full sm:max-w-[80%] flex justify-center items-center gap-2 mx-auto mt-10">
                    <div className="w-1/3 h-32 space-y-2 rounded-xl p-1 ">
                      <p className="text-center font-semibold font-kaushan text-sm h-10">
                        Explore Topics
                      </p>
                      <p className="xs:h-[180px] xl:h-20 text-center text-sm bg-white p-2 py-4 font-spartan overflow-hidden">
                        &quot;Can you help me understand quantum physics? I
                        would love to learn more about it!&quot;
                      </p>
                    </div>
                    <div className="w-1/3 h-32 space-y-2 rounded-xl p-1">
                      <p className="text-center font-semibold font-kaushan text-sm h-10">
                        Find Answer
                      </p>
                      <p className="xs:h-[180px] xl:h-20 text-center text-sm bg-white p-2 py-4 font-spartan overflow-hidden">
                        &quot;How do I create a resume that stands out? I want
                        to impress potential employers!&quot;
                      </p>
                    </div>
                    <div className="w-1/3 h-32 space-y-2 rounded-xl p-1">
                      <p className="text-center  font-semibold font-kaushan text-sm h-10">
                        Gain Your Skill
                      </p>
                      <p className="xs:h-[180px] xl:h-20 text-center text-sm bg-white p-2 py-4 font-spartan overflow-hidden">
                        &quot;What are the key principles of effective
                        communication? I want to improve my skills!&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {message?.map((answer, index) => (
                <div
                  key={index}
                  className={`chat ${
                    answer.type == "input" ? "chat-end" : "chat-start"
                  }  w-full h-full`}
                >
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full border-2 border-black">
                      <img
                        src={answer.type == "gemini" ? geminiImg : userImg}
                        alt=""
                        className="object-contain "
                      />
                    </div>
                  </div>
                  <div
                    className="chat-bubble text-white xs:text-sm sm:text-md font-nunito bg-[#2676ee] xs:max-w-[90%] sm:max-w-[70%]"
                    dangerouslySetInnerHTML={{
                      __html: answer.text
                        ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br />")
                        .replace(/^\s]\s+/gm, "<p class='list-item'>"),
                    }}
                  ></div>
                  <div ref={bottomRef} />
                </div>
              ))}
              {(loading || askPending) && (
                <div className={`chat chat-start  w-full h-full`}>
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full border-2 border-black">
                      <img src={geminiImg} alt="" className="object-contain " />
                    </div>
                  </div>
                  <div className="chat-bubble text-white text-lg bg-[#2676ee] xs:max-w-[90%] sm:max-w-[70%] flex items-center justify-center h-full">
                    <div className="typing-indicator">
                      <div className="dot bg-white"></div>
                      <div className="dot bg-white"></div>
                      <div className="dot bg-white"></div>
                    </div>
                  </div>
                  <div ref={bottomRef} />
                </div>
              )}
              <div />
            </main>

            {/* Footer */}
            <div className="xs:w-[90%] sm:w-2/3 max-h-10 relative bg-white h-auto flex justify-center items-end rounded-lg cursor-default outline-none mb-5  m-auto gap-1 ">
              <textarea
                type="text"
                placeholder="Ask me anything......"
                rows="1"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    100
                  )}px`;
                  if (e.target.scrollHeight > 100) {
                    e.target.style.overflowY = "auto";
                  } else {
                    e.target.style.overflowY = "hidden";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      submit(e);
                    }
                  }
                }}
                name="text"
                ref={inputRef}
                className="bg-white text-black w-full min-h-10 rounded-lg cursor-text outline-none scrollbar-none resize-none p-2"
              />
              <div className="h-10 flex items-center justify-cente border-l-[1px] border-blue-600">
                <BsSend
                  onClick={(e) => submit(e)}
                  className="text-blue-600 w-10 h-9 p-1 cursor-pointer hover:text-green-400 hover:scale-110"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
