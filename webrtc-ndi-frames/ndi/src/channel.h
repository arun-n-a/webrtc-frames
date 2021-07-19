#ifndef CCHANNEL_H
#define CCHANNEL_H

#include <iostream>
#include <iterator>
#include <map>
#include "audio.h"
#include "video.h"

using namespace std;

typedef std::map<std::string, std::string>Properties;

class CChannel
{
private:
    CChannel() {}
    CChannel(const CChannel&) {}
    CChannel& operator = (const CChannel&) { return *this; }
    static map<string, CChannel*> list;
public:
    
    static CChannel* GetChannel(string id)
    {
        typename map<string, CChannel*>::const_iterator it = list.find(id) ;
        return ((it != list.end())?((CChannel*)(it->second)):nullptr) ;
    }

    static void SetChannel(CChannel* channel, Properties& properties)
    {
        
        channel->m_properties.clear() ;
        if (channel->m_audio) delete channel->m_audio ;
        if (channel->m_video) delete channel->m_video ;

        channel->m_properties = properties; 
        channel->m_audio = new CAudio(properties);
        channel->m_video = new CVideo(properties);
    }

    static void ResetChannel(string id, Properties& properties)
    {
        CChannel* channel = GetChannel(id) ;
        if(channel) { SetChannel(channel, properties); }
    }

    static void destroy()
    {
        typename map<string, CChannel*>::const_iterator it = list.begin() ;
        for(;it != list.end(); ++it) { delete (*it).second; }
        list.clear();
    }
    static CChannel* book(Properties& properties)
    {
        Properties::const_iterator it = properties.find("id") ;
        string id = it->second ;

        CChannel* channel = GetChannel(id) ;
        if(!channel) 
        {
            channel = new CChannel();
            if(channel) {
                SetChannel(channel, properties);
                list[id] = channel;
            }
        }
        return channel;
    }
    static void kick(string id)
    {
        CChannel* channel = GetChannel(id) ;
        if (channel) 
        {  
			channel->m_properties.clear() ;
			if (channel->m_audio) delete channel->m_audio ;
			if (channel->m_video) delete channel->m_video ;
            delete channel ;  
            list.erase(id); 
        }
    }

    CStream * stream(string type)
    {
        return ((type=="audio")?m_audio:m_video) ;
    }
protected:
    CStream* m_audio;
    CStream* m_video;
    std::map<std::string,std::string> m_properties;
    ~CChannel() {}
};

//map<string, CChannel*> CChannel::list ; 

#endif // CCHANNEL_H

