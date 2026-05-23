// Minimal 9192 bootstrap client. Windows/MSYS2: g++ -std=c++20 9192_client_bootstrap.cpp -lws2_32 -o 9192_client_bootstrap.exe
#include <winsock2.h>
#include <ws2tcpip.h>
#include <cstdio>
#include <cstring>
#pragma comment(lib, "ws2_32.lib")
static int send_cmd(const char* host, unsigned short port, const char* cmd){WSADATA w; if(WSAStartup(MAKEWORD(2,2),&w)!=0) return 2; addrinfo hints{}; hints.ai_family=AF_INET; hints.ai_socktype=SOCK_STREAM; addrinfo* res=nullptr; char portbuf[16]; std::snprintf(portbuf,sizeof(portbuf),"%u",port); if(getaddrinfo(host,portbuf,&hints,&res)!=0) return 3; SOCKET s=socket(res->ai_family,res->ai_socktype,res->ai_protocol); if(s==INVALID_SOCKET) return 4; if(connect(s,res->ai_addr,(int)res->ai_addrlen)!=0) return 5; char msg[64]; std::snprintf(msg,sizeof(msg),"%s\n",cmd); send(s,msg,(int)std::strlen(msg),0); char buf[4096]{}; int n=recv(s,buf,sizeof(buf)-1,0); if(n>0) std::printf("%s -> %s\n",cmd,buf); closesocket(s); freeaddrinfo(res); WSACleanup(); return n>0?0:6;}
int main(int argc,char** argv){const char* host=argc>1?argv[1]:"edge.nineoneninetwo.com.br"; unsigned short port=argc>2?(unsigned short)std::atoi(argv[2]):9443; int a=send_cmd(host,port,"HELLO"); int b=send_cmd(host,port,"CAPS"); return a?a:b;}
