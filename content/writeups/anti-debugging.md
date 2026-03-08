---
title: BYUCTF 2025
summary: Notes on anti-debugging techniques, common APIs, and patching strategies.
tags:
  - reverse-engineering
  - notes
order: 1
---

# anti debugging - a guide:

**definition:**

> anti-debugging techniques are ways for a program to detect if it runs under the control of a
> debugger.

There are a lot of techniques for anti-debugging, (the mind games evolve over time)

- Basic API Anti-Debugging
  - IsDebuggerPresent()
  - CheckRemoteDebuggerPresent()
  - OutputDebugString()
  - FindWindow()

> very basic function calls that might or might not work and trigger the program to stop.

- Advanced API Anti-Debugging
  - NtQueryInformationProcess
  - NtSetInformationThread

> more advanced API calls

- Timing
  - RDPMC/RDTSC
  - GetLocalTime()
  - GetSystemTime()
  - GetTickCount()
  - ZwGetTickCount() / KiGetTickCount()
  - QueryPerformanceCounter()
  - timeGetTime()

> if the instructions take abnormally long to take effect -> might be in a debugger.

- even more advanced stuff

  - Detecting the libraries commonly used by debuggers

    As certain libraries are used by debuggers, the application calls for them. If they are attached -> debugger is present
  - Hardware breakpoint detection

    Hardware may contain specific debug registers, but the use of these hardware breakpoints can be detected -> debugger is present
  - Exploiting bugs in popular debuggers

    Debuggers have flaws that cause them to crash or misbehave. Using instructions or data values known to cause these problems -> nullifies debuggers
  - Self-debugging

    A process can be created that will try to attach itself as a debugger of the original parent process. If another debugger is already attached, this process will fail -> debugger is present
  - Using exceptions in code
    Debuggers are designed to handle certain exceptions in code. If some exceptions that aren’t executed -> debugger is present.
  - Check for modifications
    debugging often means modifying code. A program can check for changes and -> a debugger is present.

  \*\* mix and match these techniques for best results. \*\*
- How to get past this

  - know how to read code -> patch
  - use tools

# questions to ask:

- difference between Windows and Linux anti-debugging (I have asked this during the sem)
- is there also anti-static-analysis?
- how would a program know if it's in a virtual environment?

# refs:

<https://blog.cyber5w.com/malware-analysis-howto-bypass-anti-debugging-tricks-part1>
<https://securityboulevard.com/2020/09/nine-anti-debugging-techniques-for-application-security/>
<https://twelvesec.com/2023/10/10/bypassing-anti-reversing-defences-in-ios-applications/>

– VIETNAMESE

# Hướng dẫn về chống gỡ lỗi - Anti Debugging:

**Định nghĩa:**

> Các kỹ thuật chống gỡ lỗi (anti-debugging techniques) là những cách để một chương trình phát hiện xem nó có đang chạy dưới sự kiểm soát của một trình gỡ lỗi (debugger) hay không.

Có rất nhiều kỹ thuật chống gỡ lỗi, (trò chơi trí tuệ này không ngừng tiến hóa theo thời gian)

- **Chống gỡ lỗi bằng API cơ bản**
  - IsDebuggerPresent()
  - CheckRemoteDebuggerPresent()
  - OutputDebugString()
  - FindWindow()

> Các lệnh gọi hàm rất cơ bản có thể hoạt động hoặc không, và có thể khiến chương trình dừng lại.

- **Chống gỡ lỗi bằng API nâng cao**
  - NtQueryInformationProcess
  - NtSetInformationThread

> Các lệnh gọi API phức tạp hơn

- **Đo thời gian (Timing)**
  - RDPMC/RDTSC
  - GetLocalTime()
  - GetSystemTime()
  - GetTickCount()
  - ZwGetTickCount() / KiGetTickCount()
  - QueryPerformanceCounter()
  - timeGetTime()

> Nếu các lệnh mất thời gian bất thường để thực thi -> có thể đang ở trong một debugger.

- **Các kỹ thuật nâng cao hơn nữa**

  - Phát hiện các thư viện thường được sử dụng bởi debugger

    Vì một số thư viện nhất định được debugger sử dụng, ứng dụng sẽ gọi chúng. Nếu chúng được gắn vào -> debugger đang hiện diện.
  - Phát hiện breakpoint phần cứng (Hardware breakpoint detection)

    Phần cứng có thể chứa các thanh ghi gỡ lỗi đặc biệt, nhưng việc sử dụng các breakpoint phần cứng này có thể bị phát hiện -> debugger đang hiện diện.
  - Tận dụng lỗi trong các debugger phổ biến (Exploiting bugs in popular debuggers)

    Debugger có những lỗ hổng khiến chúng gặp sự cố hoặc hoạt động sai. Sử dụng các lệnh hoặc giá trị dữ liệu được biết là gây ra vấn đề -> vô hiệu hóa debugger.
  - Tự gỡ lỗi (Self-debugging)

    Một tiến trình có thể được tạo ra để cố gắng gắn chính nó làm debugger của tiến trình cha ban đầu. Nếu đã có debugger khác gắn vào, tiến trình này sẽ thất bại -> debugger đang hiện diện.
  - Sử dụng ngoại lệ trong mã (Using exceptions in code)
    Debugger được thiết kế để xử lý một số ngoại lệ trong mã. Nếu một số ngoại lệ không được thực thi -> debugger đang hiện diện.
  - Kiểm tra sự thay đổi (Check for modifications)
    Gỡ lỗi thường đồng nghĩa với việc sửa đổi mã. Một chương trình có thể kiểm tra các thay đổi và -> debugger đang hiện diện.

  **Kết hợp và phối hợp các kỹ thuật này để đạt kết quả tốt nhất.**
- **Cách vượt qua chống gỡ lỗi**

  - Biết cách đọc mã -> patch
  - Sử dụng các công cụ

# Các câu hỏi cần đặt ra:

- Sự khác biệt giữa chống gỡ lỗi trên Windows và Linux (tôi đã hỏi điều này trong kỳ học)
- Có tồn tại chống phân tích tĩnh (anti-static-analysis) không?
- Một chương trình làm thế nào để biết nó đang ở trong môi trường ảo (virtual environment)?

# Tài liệu tham khảo:

<https://blog.cyber5w.com/malware-analysis-howto-bypass-anti-debugging-tricks-part1>
<https://securityboulevard.com/2020/09/nine-anti-debugging-techniques-for-application-security/>
<https://twelvesec.com/2023/10/10/bypassing-anti-reversing-defences-in-ios-applications/>
