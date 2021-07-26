#include "audio.h"

CAudio::CAudio(Properties& properties) 
{ 
    m_channel_name   = GetProperty(properties, "channelName").c_str();
    m_sample_rate    = atoi(GetProperty(properties, "sampleRate").c_str());
    m_no_of_channels = atoi(GetProperty(properties, "noOfChannels").c_str());
    m_no_of_samples  = atoi(GetProperty(properties, "noOfSamples").c_str());
    m_channel_stride = atol(GetProperty(properties, "channelStride").c_str());

    cout <<endl <<"initializing audio channel " <<m_channel_name <<endl ; 

    NDIlib_send_create_t descriptor;
    descriptor.p_ndi_name = m_channel_name.c_str() ;
    descriptor.clock_audio = true;
    m_sender = NULL;

    if (NDIlib_initialize())
    {
        m_sender = NDIlib_send_create(&descriptor);
        cout <<endl <<"initialized sender successfully for audio channel " <<m_channel_name <<endl ; 
    }
    else 
        cout <<endl <<"failed to initialize sender for audio channel " <<m_channel_name <<endl ; 

}

CAudio::~CAudio()
{
    if (m_sender)
    {
        NDIlib_send_destroy(m_sender);
        NDIlib_destroy();
    }
}

std::string CAudio::GetProperty(Properties& properties, std::string key)
{
    Properties::const_iterator it = properties.find(key) ;
    return ((it != properties.end()) ? it -> second : "0") ; 
}

int CAudio::send(uint8_t* buffer, size_t bsize)  
{
    NDIlib_audio_frame_v2_t frame;

    frame.sample_rate             = m_sample_rate;                      // 48000
    frame.no_channels             = m_no_of_channels;                   // 1
    frame.no_samples              = m_no_of_samples;                    // 1920
    frame.channel_stride_in_bytes = m_channel_stride * sizeof(float);   // 1920 * sizeof(float);

    frame.p_data = (float*)malloc(frame.no_channels * frame.channel_stride_in_bytes + 1);
    std::copy((float*)buffer, (float*)buffer + bsize, frame.p_data);

    NDIlib_send_send_audio_v2(m_sender, &frame);
    //free(frame.p_data);

    cout << "a" ;

    return 0;
}

