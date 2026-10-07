// Khai bao bien va thu vien
#include <iostream>
#include <string>
using namespace std;

string n;
char ketQua[20];
int soLanXuatHien[10];
int doDai;

// Ham in ket qua
void inKetQua() {
    for (int i = 0; i < doDai; i++) {
        cout << ketQua[i];
    }
    cout << '\n';
	
}

// Ham quy lui
void quayLui(int viTri) {
    // Dk dung va in ket qua
    if (viTri == doDai) { 
        inKetQua();
        return;
		
    }

    // thu tu 9 -> 1 de sap xep giam dan
    for (int chuSo = 9; chuSo >= 1; chuSo--) {
        if (soLanXuatHien[chuSo] > 0) {
            ketQua[viTri] = char(chuSo + '0');
            soLanXuatHien[chuSo]--;

            // quy lui de chon so o vi tri tiep theo
            quayLui(viTri + 1);

            // thu so khac
            soLanXuatHien[chuSo]++;
			
        }
    }
}

// Ham chinh
int main() {
    cin >> n;

    // Lấy độ dài và đếm số lần xuất hiện của từng chữ số.
    doDai = n.length();
    for (int i = 0; i < doDai; i++) {
        int chuSo = n[i] - '0';
        soLanXuatHien[chuSo]++;
    }

    quayLui(0);
    return 0;
}
