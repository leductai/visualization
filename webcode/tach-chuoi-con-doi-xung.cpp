// Khai bao bien va thu vien
#include <iostream>
#include <string>
using namespace std;

string s;
int doDai;
int trai[105], phai[105];
int soDoan;


// Ham kiem tra doi xung
bool checkDoiXung(int l, int r) { 
    while (l < r) {
        if (s[l] != s[r]) return false;
        l++;
        r--;
    }
    return true;
}

// Ham xuat 
void inPhanHoach() {
    for (int i = 0; i < soDoan; i++) {
        if (i > 0) cout << ' ';
        for (int j = trai[i]; j <= phai[i]; j++) cout << s[j];
    }
    cout << '\n';
}

// Ham quay lui
void quayLui(int viTri) {
    if (viTri == doDai) { // dieu kien dung
        inPhanHoach();
        return;
    }

    for (int ketThuc = viTri; ketThuc < doDai; ketThuc++) { // bat dau tu ketThuc = viTri, khi keThuc van be hon doDai thi ketThuc +1
        if (checkDoiXung(viTri, ketThuc)) {
            trai[soDoan] = viTri;
            phai[soDoan] = ketThuc;
            soDoan++;
            quayLui(ketThuc + 1); // de quy 
            soDoan--;
        }
    }
}

// Ham chinh
int main() {
    cin >> s; //input dau vao
    doDai = s.length();
    quayLui(0);
    return 0;
}
