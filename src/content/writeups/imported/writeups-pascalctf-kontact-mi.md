---
title: "KONtAct MI - reverse"
description: "cat KONtAct\\ MI\\ -\\ reverse.md KONtAct MI - reverse"
published: "2025-08-29"
updated: "2025-08-29"
event: "pascalCTF"
category: "Web Security"
kind: "writeup"
status: "solved"
tags: ["Web Security", "pascalCTF", "Writeup"]
readingTime: 2
wordCount: 306
featured: false
sourcePath: "~/ctf/writeups/(pascalCTF) KONTACT MI.md"
---

cat KONtAct\ MI\ -\ reverse.md 
# KONtAct MI - reverse

> Posted by Cr0nical

## 1. Analysis

![](http://note.bksec.vn/pad/uploads/6147bb65-2ff6-4e28-8b6d-97914dadb68f.png)

![](http://note.bksec.vn/pad/uploads/8cde6863-c183-40b7-bf9b-7e5be018b29a.png)

![](http://note.bksec.vn/pad/uploads/0b00d3fe-d255-480c-afd1-743ae0827f20.png)

![](http://note.bksec.vn/pad/uploads/d1e2a09f-6326-4370-abff-35bef4ca3d6c.png)

Mình nhìn vào dòng   ```curl_easy_setopt(curl, CURLOPT_URL, "https://kontactmi.challs.pascalctf.it/adminSupport")```
và ``` snprintf(json_data, 256, "{\"code\":\"%s\"}", progress);``` nhận thấy chương trình gửi progress vào '/adminSupport', đây có thể là cơ chế dành cho admin. Trong khi đó hàm ```get_collectable``` lại tạo progress từ collectable nên có vẻ như mảng các struct collectables được cho bên trên mang ý nghĩa nào đó trong xác thực "/adminSupport". Mình thử tra trên mạng thì nhận được.

![](http://note.bksec.vn/pad/uploads/4a00c167-2449-4adf-9ecf-1ba545fa690d.png)

Hừm, xem ra đây có lẽ là cheat code lấy flag. Mình sẽ gửi nó đến "https://kontactmi.challs.pascalctf.it/adminSupport" xem sao. Kết quả nhận được là:

![](http://note.bksec.vn/pad/uploads/acba9fe7-b43e-4fde-95c3-a5618b18114a.png)
> Note: Công nhận Metal Gear Solid V của ngài Kojima đỉnh thật :v 

## 2. Script
```
import requests
code = "up-up-down-down-left-right-left-right-B-A"
url = "https://kontactmi.challs.pascalctf.it/adminSupport"
r = requests.post(
    url,
    json={"code": code},
    headers={"Content-Type": "application/json"}
)


print(r.text)
```


# another writeup by howdoitype
Explore the main function, we can see how it sets up basic interfactes for the program:
```c
/**
 * @file main.c
 * @author Marco Balducci, Alan Davide Bovo
 * @date 2024-08-09
 * Compile with: gcc main.c util.c -lcurl -o kontactmi
 */
#include "util.h"

struct player{
    char name[20];
    int score;
};

void play_game(){
    while(1){
        print_map();
        char choice = getchar();
        getchar();
        if(choice == 'w')
            update_position(0, -1);
        else if(choice == 's')
            update_position(0, 1);
        else if(choice == 'a')
            update_position(-1, 0);
        else if(choice == 'd')
            update_position(1, 0);
        else if(choice == 'q')
            break;

        clear_screen();
    }
    return;
}

int main(){
    setupbuf();
    setup_collectables();

    while(1){
        char choice = menu();
        if(choice == '1')
            play_game();
        else if(choice == '2')
            contact_support();
        else if(choice == '3')
            break;
    }
    return 0;
}
```
wasd keys are mapped with the corresponding movement
we can play the game or call support.
analyze the util.c file, we see: 
```c
void contact_support(void){
    puts("***** Contact support *****\n\n");
    printf("Would you like to send your progress to support? (Y/n): ");
    char choice = getchar();
    clearStdin();
    if (choice != 'n' && choice != 'N'){
        puts("\nSending progress to support...");
        CURL *curl;
        CURLcode res;
        curl_global_init(CURL_GLOBAL_DEFAULT);
        curl = curl_easy_init();

        if (curl){
            // TODO: add GET requests to api @ /adminSupport
            // curl_easy_setopt(curl, CURLOPT_URL, URL);
            // curl_easy_perform(curl);

            curl_easy_setopt(curl, CURLOPT_URL, "https://kontactmi.challs.pascalctf.it/adminSupport"); // TODO: Change to actual support URL
            char json_data[256];
            snprintf(json_data, 256, "{\"code\":\"%s\"}", progress);

            struct curl_slist *headers = NULL;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_data);

            sleep(2);
            res = curl_easy_perform(curl);
            
            if (res != CURLE_OK)
                puts("Failed to send progress to support, please contact admins for help");
            
            puts("\n");
            
            curl_easy_cleanup(curl);
            curl_slist_free_all(headers);
            curl_global_cleanup();
        }
        else
            printf("%s", "Something really bad happened");
    }

    return;
}
```
the script use curl to send a request to the server containing the player's progress, which is simillar to the famous konami code(also hinted at in the name of the challenge)
The comments tell us that the owner wanted to change the url to the actual support url, so we can infer that the current url will get us to the flag.
Looking at how the HTTP request, we can easily forge a fake request containing every progress possible. Let's first try to send a request that contains the maximum progress:
```curl -X POST -H "Content-Type: application/json" -d '{"code":"up-up-down-down-left-right-left-right-B-A"}' https://kontactmi.challs.pascalctf.it/adminSupport```
the terminal outputs the flag:

<h1>
    from vqt with love
</h1>

Vẫn nhận thấy chương trình gửi progress tới server, nhưng không biết cách gửi code như trên mà mình chơi game chay luôn.

Mình chơi thử 1 lượt rồi lưu lại kết quả mỗi khi đạt đến 'x', rồi đi lại theo đúng collectables. Cuối cùng chọn contact_support để lấy flag.
