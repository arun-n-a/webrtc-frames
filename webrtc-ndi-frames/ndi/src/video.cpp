#include "video.h"

CVideo::CVideo(Properties& properties) 
{ 
	cout << endl << " **** initializing **** video **** started " ; 

	m_channel_name   = GetProperty(properties, "channelName").c_str();
    m_xres           = atoi(GetProperty(properties, "xres").c_str());
	m_yres           = atoi(GetProperty(properties, "yres").c_str());
	m_framerate      = atoi(GetProperty(properties, "frameRate").c_str());

	NDIlib_send_create_t descriptor;
	descriptor.p_ndi_name = "testv" ; // GetProperty(properties, "channelName").c_str() ;
	m_sender = NULL;

	if (NDIlib_initialize())
	{
		m_sender = NDIlib_send_create(&descriptor);
	    cout << endl << " **** initializing **** video  *** sender initialized" ; 
	}
	else 
		cout << endl << " **** initializing **** video  *** sender initialize failed" ;

}

CVideo::~CVideo()
{
	if (m_sender)
	{
	    cout << endl << " **** initializing **** video  *** sender destroyed" ; 
		NDIlib_send_destroy(m_sender);
		NDIlib_destroy();
	}
}

std::string CVideo::GetProperty(Properties& properties, std::string key)
{
	Properties::const_iterator it = properties.find(key) ;
	return it -> second ; 
}

int CVideo::send(uint8_t* buffer, size_t bsize)  
{

	if (!m_sender) return 0 ;
	NDIlib_video_frame_v2_t frame;


    frame.xres = m_xres;
    frame.yres = m_yres;
    frame.FourCC = NDIlib_FourCC_type_RGBA;
    frame.line_stride_in_bytes = m_xres * 4;

	frame.p_data=buffer ;


	for (int idx = 4; idx; idx--) {
//		NDIlib_send_send_video_v2(m_sender, &frame);
		    NDIlib_send_send_video_async_v2(m_sender, &frame);
	}
//	free(frame.p_data);

	cout << "v" ;

	return 0;
}

