#include <iostream>
using namespace std;

int trongLuong[1005];
int giaTri[1005];
long long giaTriMax[100005];

int main() {
    int soDoVat, trongLuongToiDa;
    cin >> soDoVat >> trongLuongToiDa;

    for (int i = 1; i <= soDoVat; i++) {
        cin >> trongLuong[i];
    }
    for (int i = 1; i <= soDoVat; i++) {
        cin >> giaTri[i];
    }

    for (int j = 0; j <= trongLuongToiDa; j++) {
        giaTriMax[j] = 0;
    }

    for (int i = 1; i <= soDoVat; i++) {
        for (int j = trongLuongToiDa; j >= trongLuong[i]; j--) {
            if (giaTriMax[j - trongLuong[i]] + giaTri[i] > giaTriMax[j]) {
                giaTriMax[j] = giaTriMax[j - trongLuong[i]] + giaTri[i];
            }
        }
    }

    cout << giaTriMax[trongLuongToiDa] << '\n';

    return 0;
}