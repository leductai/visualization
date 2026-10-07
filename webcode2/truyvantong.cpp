#include <iostream>
using namespace std;

long long tongTichLuy[200005];

int main() {

    int soPhanTu, soTruyVan;
    cin >> soPhanTu >> soTruyVan;

    tongTichLuy[0] = 0;

    for (int i = 1; i <= soPhanTu; i++) {
        long long giaTri;
        cin >> giaTri;
        tongTichLuy[i] = tongTichLuy[i-1] + giaTri;
    }

    for (int i = 0; i < soTruyVan; i++) {
        int chiSoTrai, chiSoPhai;
        cin >> chiSoTrai >> chiSoPhai;
        cout << tongTichLuy[chiSoPhai] - tongTichLuy[chiSoTrai-1] << '\n';
    }
    
    return 0;
}
