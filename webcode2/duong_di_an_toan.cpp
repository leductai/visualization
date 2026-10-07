#include <iostream>
#include <string>
using namespace std;

long long soDuongDi[1005][1005];
int mod = 1000000007;

int main() {
    int kichThuoc;
    cin >> kichThuoc;

    string luoi[1005];
    for (int i = 0; i < kichThuoc; i++) {
        cin >> luoi[i];
    }

    for (int i = 0; i < kichThuoc; i++) {
        for (int j = 0; j < kichThuoc; j++) {
            soDuongDi[i][j] = 0;
        }
    }

    if (luoi[0][0] == '.') {
        soDuongDi[0][0] = 1;
    }

    for (int i = 0; i < kichThuoc; i++) {
        for (int j = 0; j < kichThuoc; j++) {
            if (luoi[i][j] == '*') {
                soDuongDi[i][j] = 0;
            } else {
                if (i > 0) {
                    soDuongDi[i][j] = (soDuongDi[i][j] + soDuongDi[i-1][j]) % mod;
                }
                if (j > 0) {
                    soDuongDi[i][j] = (soDuongDi[i][j] + soDuongDi[i][j-1]) % mod;
                }
            }
        }
    }

    cout << soDuongDi[kichThuoc-1][kichThuoc-1] << '\n';

    return 0;
}